import { createConfig } from './config.mjs';
import { isGateway, createGateway } from '../../gateway/index.mjs';
import { RequestFactory } from '../../request/request-factory.mjs';
import { EmbedUrlFactory } from '../../request/embed-url-factory.mjs';
import { BannerManager } from '../../banner/banner-manager.mjs';
import { DimensionsProvider } from '../../banner/responsive/dimensions-provider.mjs';
import { AttributesParser } from '../../banner/attributes-parser.mjs';
import { Options as BannerOptions } from '../../banner/options.mjs';
import { ClosingManager } from '../../banner/closing/closing-manager.mjs';
import { EventBus } from '../../event/event-bus.mjs';
import { Events } from '../../event/events.mjs';
import { BannerRenderer } from '../../renderer/banner-renderer.mjs';
import { BannerInteractionWatcher } from '../../interaction/banner-interaction-watcher.mjs';
import { MetricsEventsListener } from '../../metrics/metrics-events-listener.mjs';
import { MetricsSender } from '../../metrics/metrics-sender.mjs';
import { EventsConfig } from '../../metrics/events-config.mjs';
import { BannerFrameMessenger } from '../../frame/banner-frame-messenger.mjs';
import { getHtmlElement } from '../../utils/dom-helpers.mjs';

export class Client {
    #version;
    #config;
    #eventBus;
    #requestFactory;
    #embedUrlFactory;
    #gateway = null;
    #bannerManager;
    #bannerInteractionWatcher;
    #closingManager;
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
            options.version,
            options.channel,
        );

        this.#bannerManager = new BannerManager(
            this.#eventBus,
            DimensionsProvider.fromCurrentWindow(),
            new BannerRenderer(
                options.template,
            ),
        );

        this.#bannerInteractionWatcher = new BannerInteractionWatcher(
            this.#bannerManager,
            this.#eventBus,
            options.interaction,
        );

        this.#metricsSender = MetricsSender.createFromReceivers(
            options.metrics.receiver,
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
                    metrics: {
                        events: options.metrics.events,
                        params: options.metrics.params,
                    },
                },
            },
            bannerManager: this.#bannerManager,
            metricsSender: this.#metricsSender,
        });

        this.#closingManager = new ClosingManager({
            bannerManager: this.#bannerManager,
            eventBus: this.#eventBus,
            config: {
                storage: options.closing.storage,
                key: options.closing.key,
                maxItems: options.closing.maxItems,
            },
            frameMessenger: this.#frameMessenger,
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
                external: true,
                embed: false,
            });

            for (let banner of banners) {
                banner.redrawIfNeeded();
            }
        });

        this.#frameMessenger.listen();
        this.#metricsEventsListener.attach(new EventsConfig({
            events: options.metrics.events,
            params: options.metrics.params,
        }));
        this.#bannerInteractionWatcher.start();
        this.#closingManager.attachUi();
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

    createBanner(element, position, resources = {}, options = {}, mode = 'managed', refWindow = window) {
        element = getHtmlElement(element, refWindow);

        if ('embed' === mode) {
            const iframe = this.#createIframe(element, position, resources, options);
            const banner = this.#bannerManager.addEmbedBanner(element, iframe, position, options);

            this.#frameMessenger.connectBanner(banner);
            element.insertAdjacentElement('beforeend', iframe);

            return banner;
        }

        return this.#bannerManager.addManagedBanner(element, position, resources, options, refWindow);
    }

    closeBanner(bannerId) {
        this.#closingManager.closeBanner(bannerId);
    }

    attachBanners(snippet = document, refWindow = window) {
        const elements = snippet.querySelectorAll('[data-amp-banner]:not([data-amp-attached])');

        for (let element of elements) {
            const position = element.dataset.ampBanner;

            if (!position) {
                console.warn('Unable to attach a banner to the element ', element, ' because the attribute "data-amp-banner" has an empty value.');

                continue;
            }

            let banner;

            if ('ampBannerExternal' in element.dataset) {
                banner = this.#bannerManager.addExternalBanner(element, refWindow);
            } else {
                const resources = AttributesParser.parseResources(element);
                const options = AttributesParser.parseOptions(element);
                const mode = element.dataset.ampMode || 'managed';

                banner = this.createBanner(element, position, resources, options, mode, refWindow);
            }

            this.#eventBus.dispatch(this.EVENTS.ON_BANNER_ATTACHED, { banner });
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
            request.addPosition(banner.position, banner.resources, '1' !== banner.options.get('omit-default-resources', '0').toString())
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

                const positionData = data[banner.position];
                const banners = Array.isArray(positionData['banners']) ? positionData['banners'] : Object.values(positionData['banners']);
                const validBanners = [];

                for (let i = 0; i < banners.length; i++) {
                    const banner = banners[i];

                    if (banner.id && !this.#closingManager.isClosed(banner.id)) {
                        validBanners.push(banner);
                    }
                }

                positionData.banners = validBanners;

                if ('embed' === positionData.mode && 0 < positionData.banners.length) {
                    if ('options' in positionData) {
                        banner.overrideOptions(positionData.options);
                    }

                    this.createBanner(banner.element, banner.position, banner.rawResources, banner.options.options, positionData.mode);
                    this.#bannerManager.removeBanner(banner);

                    continue;
                }

                banner.setResponseData(positionData);
            }

            this.#eventBus.dispatch(this.EVENTS.ON_FETCH_SUCCESS, { response });
        };

        const error = (response) => {
            for (let banner of banners) {
                banner.setState(this.#bannerManager.STATE.ERROR, 'Request on api failed.');
            }

            this.#eventBus.dispatch(this.EVENTS.ON_FETCH_ERROR, { response });
        };

        this.#eventBus.dispatch(this.EVENTS.ON_BEFORE_FETCH);
        this.getGateway().fetch(request, success, error);
    }

    #createIframe(element, position, resources, options) {
        const iframe = document.createElement('iframe');
        const versionParam = `cv=${encodeURIComponent(this.version.semver)}`;
        const bannerOptions = new BannerOptions(options);

        let src = element.dataset.ampEmbedSrc || this.#embedUrlFactory.create(position, resources, bannerOptions.options);
        src += -1 === src.indexOf('?') ? `?${versionParam}` : `&${versionParam}`;

        iframe.width = '100%';
        iframe.height = '100%';
        iframe.allowFullscreen = true;
        iframe.scrolling = 'no';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.style.background = 'transparent';
        iframe.style.visibility = 'hidden';

        iframe.setAttribute('allowtransparency', 'true');

        const loading = bannerOptions.evaluate('loading', 0);
        const fetchPriority = bannerOptions.evaluate('fetchpriority', 0);

        if (null !== loading) {
            iframe.loading = loading;
        }

        if (null !== fetchPriority) {
            iframe.setAttribute('fetchpriority', fetchPriority);
        }

        [...element.attributes].map(({ name, value }) => {
            return name.startsWith('data-iframe-') && (iframe.setAttribute(name.substring(12), value));
        });

        iframe.src = src;

        return iframe;
    }
}
