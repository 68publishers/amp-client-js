const internal = require('../../utils/internal-state');
const _config = require('./config');
const _gateway = require('../../gateway/index');
const RequestFactory = require('../../request/request-factory');
const EmbedUrlFactory = require('../../request/embed-url-factory');
const BannerManager = require('../../banner/banner-manager');
const ManagedBanner = require('../../banner/managed/managed-banner');
const AttributesParser = require('../../banner/attributes-parser');
const EventBus = require('../../event/event-bus');
const Events = require('../../event/events');
const BannerRenderer = require('../../renderer/banner-renderer');
const BannerInteractionWatcher = require('../../interaction/banner-interaction-watcher');
const MetricsEventListener = require('../../metrics/metrics-events-listener');
const MetricsSender = require('../../metrics/metrics-sender');
const BannerFrameMessenger = require('../../frame/banner-frame-messenger');

class Client {
    /**
     * @param {ClientVersion} version
     * @param {Object} options
     */
    constructor (version, options) {
        // constants
        this.EVENTS = Events;

        const privateProperties = internal(this);

        options = _config(options);

        privateProperties.config = options;
        privateProperties.version = version;
        privateProperties.eventBus = new EventBus();
        privateProperties.requestFactory = new RequestFactory(
            options.method,
            options.url,
            options.version,
            options.channel,
        );
        privateProperties.embedUrlFactory = new EmbedUrlFactory(
            options.url,
            options.channel,
        );

        privateProperties.gateway = null;
        privateProperties.bannerManager = new BannerManager(privateProperties.eventBus);
        privateProperties.bannerRenderer = new BannerRenderer(options.template);
        privateProperties.bannerInteractionWatcher = new BannerInteractionWatcher(
            privateProperties.bannerManager,
            privateProperties.eventBus,
            options.interaction,
        );
        privateProperties.metricsSender = MetricsSender.createFromReceivers(
            options.metrics.receiver,
            options.metrics.disabledEvents,
        );
        privateProperties.metricsEventListener = new MetricsEventListener(
            privateProperties.metricsSender,
            privateProperties.eventBus,
            options.channel,
        );
        privateProperties.frameMessenger = new BannerFrameMessenger({
            origin: options.url,
            connectionData: {
                extendedConfig: {
                    interaction: options.interaction,
                },
            },
            bannerManager: privateProperties.bannerManager,
            metricsSender: privateProperties.metricsSender,
        });

        this.setLocale(options.locale);
        privateProperties.requestFactory.origin = options.origin;

        let resourceName;

        for (resourceName in options.resources) {
            privateProperties.requestFactory.addDefaultResource(resourceName, options.resources[resourceName]);
            privateProperties.embedUrlFactory.addDefaultResource(resourceName, options.resources[resourceName]);
        }

        window.addEventListener('resize', () => {
            const banners = privateProperties.bannerManager.getBannersByState({
                state: privateProperties.bannerManager.STATE.RENDERED,
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

        privateProperties.frameMessenger.listen();
        privateProperties.metricsEventListener.attach();
        privateProperties.bannerInteractionWatcher.start();
    }

    /**
     * @returns {ClientVersion}
     */
    get version() {
        return internal(this).version;
    }

    on(event, callback, scope = null) {
        return internal(this).eventBus.subscribe(event, callback, scope);
    }

    setLocale(locale) {
        internal(this).requestFactory.locale = locale;
        internal(this).embedUrlFactory.locale = locale;
    }

    setGateway(gateway) {
        if (!_gateway.isGateway(gateway)) {
            throw new TypeError('Argument gateway mut be instance of AbstractGateway.');
        }

        internal(this).gateway = gateway;
    }

    getGateway() {
        if (null === internal(this).gateway) {
            this.setGateway(_gateway.create());
        }

        return internal(this).gateway;
    }

    createBanner(element, position, resources = {}, options = {}) {
        return internal(this).bannerManager.addManagedBanner(element, position, resources, options);
    }

    attachBanners(snippet = document) {
        const privateProperties = internal(this);
        const elements = snippet.querySelectorAll('[data-amp-banner]:not([data-amp-attached])');

        for (let element of elements) {
            const position = element.dataset.ampBanner;

            if (!position) {
                console.warn('Unable to attach a banner to the element ', element, ' because the attribute "data-amp-banner" has an empty value.');

                continue;
            }

            let banner;

            if ('ampBannerExternal' in element.dataset) {
                banner = privateProperties.bannerManager.addExternalBanner(element);
            } else if ('ampMode' in element.dataset && 'embed' === element.dataset.ampMode) {
                const { iframe, options } = this.#createIframeAndOptions(element, position);
                banner = privateProperties.bannerManager.addEmbedBanner(iframe, position, options);

                privateProperties.frameMessenger.connectBanner(banner);
                element.insertAdjacentElement('afterend', iframe);
                element.remove();

                element = iframe;
            } else {
                const resources = AttributesParser.parseResources(element);
                const options = AttributesParser.parseOptions(element);

                banner = this.createBanner(element, position, resources, options);
            }

            privateProperties.eventBus.dispatch(this.EVENTS.ON_BANNER_ATTACHED, banner);
        }
    }

    fetch() {
        const privateProperties = internal(this);
        const banners = privateProperties.bannerManager.getBannersByState({
            state: privateProperties.bannerManager.STATE.NEW,
            managed: true,
            external: false,
            embed: false,
        });

        if (!banners.length) {
            return;
        }

        const request = privateProperties.requestFactory.create();

        for (let banner of banners) {
            request.addPosition(banner.position, banner.resources)
        }

        const success = (response) => {
            const data = response.data;

            for (let banner of banners) {
                if (!(banner.position in data)
                    || !('banners' in data[banner.position])
                    || !Object.values(data[banner.position]['banners']).length) {

                    banner.setState(privateProperties.bannerManager.STATE.NOT_FOUND, 'Banner not found in fetched response.');

                    continue;
                }

                if (!Array.isArray(data[banner.position]['banners'])) {
                    data[banner.position]['banners'] = Object.values(data[banner.position]['banners']);
                }

                banner.setResponseData(data[banner.position]);
                this.renderBanner(banner);
            }

            privateProperties.eventBus.dispatch(this.EVENTS.ON_FETCH_SUCCESS, response);
        };

        const error = (response) => {
            for (let banner of banners) {
                banner.setState(privateProperties.bannerManager.STATE.ERROR, 'Request on api failed.');
            }

            privateProperties.eventBus.dispatch(this.EVENTS.ON_FETCH_ERROR, response);
        };

        privateProperties.eventBus.dispatch(this.EVENTS.ON_BEFORE_FETCH);
        this.getGateway().fetch(request, success, error);
    }

    renderBanner(banner) {
        if (!(banner instanceof ManagedBanner)) {
            throw new TypeError(`Only managed banners can be rendered.`);
        }

        const privateProperties = internal(this);

        try {
            banner.html = privateProperties.bannerRenderer.render(banner);
        } catch (e) {
            banner.setState(privateProperties.bannerManager.STATE.ERROR, 'Render error: ' + e.message);

            return;
        }

        banner.setState(privateProperties.bannerManager.STATE.RENDERED, 'Banner was successfully rendered.');
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
        iframe.src = element.dataset.ampEmbedSrc || internal(this).embedUrlFactory.create(position, AttributesParser.parseResources(element), options);
        iframe.setAttribute('allowtransparency', 'true');

        if ('lazy' === options.loading) {
            iframe.loading = 'lazy';
        }

        return { iframe, options };
    }
}

module.exports = Client;
