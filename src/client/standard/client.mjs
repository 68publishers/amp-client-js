import { createConfig } from './config.mjs';
import { isGateway, createGateway } from '../../gateway/index.mjs';
import { RequestFactory } from '../../request/request-factory.mjs';
import { EmbedUrlFactory } from '../../request/embed-url-factory.mjs';
import { BannerManager } from '../../banner/banner-manager.mjs';
import { ManagedBanner } from '../../banner/managed/managed-banner.mjs';
import { AttributesParser } from '../../banner/attributes-parser.mjs';
import { EventBus } from '../../event/event-bus.mjs';
import { Events } from '../../event/events.mjs';
import { BannerRenderer } from '../../renderer/banner-renderer.mjs';
import { BannerInteractionWatcher } from '../../interaction/banner-interaction-watcher.mjs';
import { MetricsEventsListener } from '../../metrics/metrics-events-listener.mjs';
import { MetricsSender } from '../../metrics/metrics-sender.mjs';
import { BannerFrameMessenger } from '../../frame/banner-frame-messenger.mjs';

export class Client {
    #version;
    #config;
    #eventBus;
    #requestFactory;
    #embedUrlFactory;
    #gateway = null;
    #bannerManager;
    #bannerRenderer;
    #bannerInteractionWatcher;
    #metricsSender;
    #metricsEventsListener;
    #frameMessenger;

    /**
     * @param {ClientVersion} version
     * @param {Object} options
     */
    constructor (version, options) {
        this.EVENTS = Events;

        this.#version = version;
        this.#config = options = createConfig(options);
        this.#eventBus = new EventBus();
        this.#requestFactory = new RequestFactory(
            options.method,
            options.url,
            options.version,
            options.channel,
        );
        this.#embedUrlFactory = new EmbedUrlFactory(
            options.url,
            options.channel,
        );

        this.#bannerManager = new BannerManager(
            this.#eventBus,
        );
        this.#bannerRenderer = new BannerRenderer(
            options.template,
        );
        this.#bannerInteractionWatcher = new BannerInteractionWatcher(
            this.#bannerManager,
            this.#eventBus,
            options.interaction,
        );
        this.#metricsSender = MetricsSender.createFromReceivers(
            options.metrics.receiver,
            options.metrics.disabledEvents,
        );
        this.#metricsEventsListener = new MetricsEventsListener(
            this.#metricsSender,
            this.#eventBus,
            options.channel,
        );
        this.#frameMessenger = new BannerFrameMessenger({
            origin: options.url,
            connectionData: {
                extendedConfig: {
                    interaction: options.interaction,
                },
            },
            bannerManager: this.#bannerManager,
            metricsSender: this.#metricsSender,
        });

        this.setLocale(options.locale);
        this.#requestFactory.origin = options.origin;

        for (let resourceName in options.resources) {
            this.#requestFactory.addDefaultResource(resourceName, options.resources[resourceName]);
            this.#embedUrlFactory.addDefaultResource(resourceName, options.resources[resourceName]);
        }

        window.addEventListener('resize', () => {
            const banners = this.#bannerManager.getBannersByState({
                state: this.#bannerManager.STATE.RENDERED,
                managed: true,
                external: false,
                embed: false,
            });

            for (let i in banners) {
                if (!banners[i].needRedraw()) {
                    continue;
                }

                this.renderBanner(banners[i]);
            }
        });

        this.#frameMessenger.listen();
        this.#metricsEventsListener.attach();
        this.#bannerInteractionWatcher.start();
    }

    /**
     * @returns {ClientVersion}
     */
    get version() {
        return this.#version;
    }

    on(event, callback, scope = null) {
        return this.#eventBus.subscribe(event, callback, scope);
    }

    setLocale(locale) {
        this.#requestFactory.locale = locale;
        this.#embedUrlFactory.locale = locale;
    }

    setGateway(gateway) {
        if (!isGateway(gateway)) {
            throw new TypeError('Argument gateway mut be instance of AbstractGateway.');
        }

        this.#gateway = gateway;
    }

    /**
     * @returns {AbstractGateway}
     */
    getGateway() {
        if (null === this.#gateway) {
            this.setGateway(createGateway());
        }

        return this.#gateway;
    }

    createBanner(element, position, resources = {}, options = {}) {
        return this.#bannerManager.addManagedBanner(element, position, resources, options);
    }

    attachBanners(snippet = document) {
        const elements = snippet.querySelectorAll('[data-amp-banner]:not([data-amp-attached])');

        for (let element of elements) {
            const position = element.dataset.ampBanner;

            if (!position) {
                console.warn('Unable to attach a banner to the element ', element, ' because the attribute "data-amp-banner" has an empty value.');

                continue;
            }

            let banner;

            if ('ampBannerExternal' in element.dataset) {
                banner = this.#bannerManager.addExternalBanner(element);
            } else if ('ampMode' in element.dataset && 'embed' === element.dataset.ampMode) {
                const { iframe, options } = this.#createIframeAndOptions(element, position);
                banner = this.#bannerManager.addEmbedBanner(iframe, position, options);

                this.#frameMessenger.connectBanner(banner);
                element.insertAdjacentElement('afterend', iframe);
                element.remove();

                element = iframe;
            } else {
                const resources = AttributesParser.parseResources(element);
                const options = AttributesParser.parseOptions(element);

                banner = this.createBanner(element, position, resources, options);
            }

            this.#eventBus.dispatch(this.EVENTS.ON_BANNER_ATTACHED, banner);
        }
    }

    fetch() {
        const banners = this.#bannerManager.getBannersByState({
            state: this.#bannerManager.STATE.NEW,
            managed: true,
            external: false,
            embed: false,
        });

        if (!banners.length) {
            return;
        }

        const request = this.#requestFactory.create();

        for (let banner of banners) {
            request.addPosition(banner.position, banner.resources)
        }

        const success = (response) => {
            const data = response.data;

            for (let banner of banners) {
                if (!(banner.position in data)
                    || !('banners' in data[banner.position])
                    || !Object.values(data[banner.position]['banners']).length) {

                    banner.setState(this.#bannerManager.STATE.NOT_FOUND, 'Banner not found in fetched response.');

                    continue;
                }

                if (!Array.isArray(data[banner.position]['banners'])) {
                    data[banner.position]['banners'] = Object.values(data[banner.position]['banners']);
                }

                banner.setResponseData(data[banner.position]);
                this.renderBanner(banner);
            }

            this.#eventBus.dispatch(this.EVENTS.ON_FETCH_SUCCESS, response);
        };

        const error = (response) => {
            for (let banner of banners) {
                banner.setState(this.#bannerManager.STATE.ERROR, 'Request on api failed.');
            }

            this.#eventBus.dispatch(this.EVENTS.ON_FETCH_ERROR, response);
        };

        this.#eventBus.dispatch(this.EVENTS.ON_BEFORE_FETCH);
        this.getGateway().fetch(request, success, error);
    }

    renderBanner(banner) {
        if (!(banner instanceof ManagedBanner)) {
            throw new TypeError(`Only managed banners can be rendered.`);
        }

        try {
            banner.html = this.#bannerRenderer.render(banner);
        } catch (e) {
            banner.setState(this.#bannerManager.STATE.ERROR, 'Render error: ' + e.message);

            return;
        }

        banner.setState(this.#bannerManager.STATE.RENDERED, 'Banner was successfully rendered.');
    }

    #createIframeAndOptions(element, position) {
        const options = AttributesParser.parseOptions(element);
        const iframe = document.createElement('iframe');

        [...element.attributes].map(({ name, value }) => {
            iframe.setAttribute(name, value);
        })

        iframe.width = '100%';
        iframe.height = '100%';
        iframe.allowFullscreen = true;
        iframe.scrolling = 'no';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.src = element.dataset.ampEmbedSrc || this.#embedUrlFactory.create(position, AttributesParser.parseResources(element), options);
        iframe.setAttribute('allowtransparency', 'true');

        if ('lazy' === options.loading) {
            iframe.loading = 'lazy';
        }

        return { iframe, options };
    }
}
