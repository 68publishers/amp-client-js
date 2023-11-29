const internal = require('../utils/internal-state');
const _config = require('../config/index');
const _gateway = require('../gateway/index');
const RequestFactory = require('../request/request-factory');
const BannerManager = require('../banner/banner-manager');
const ManagedBanner = require('../banner/managed/managed-banner');
const EventBus = require('../event/event-bus');
const Events = require('../event/events');
const BannerRenderer = require('../renderer/banner-renderer');
const BannerInteractionWatcher = require('../interaction/banner-interaction-watcher');
const MetricsEventListener = require('../metrics/metrics-events-listener');

class Client {
    constructor (options) {
        // constants
        this.EVENTS = Events;

        const privateProperties = internal(this);

        options = _config(options);
        privateProperties.eventBus = new EventBus();
        privateProperties.requestFactory = new RequestFactory(
            options.method,
            options.url,
            options.version,
            options.channel,
        );

        privateProperties.gateway = null;
        privateProperties.bannerManager = new BannerManager(privateProperties.eventBus);
        privateProperties.bannerRenderer = new BannerRenderer(options.template);
        privateProperties.bannerInterractionWatcher = new BannerInteractionWatcher(
            privateProperties.bannerManager,
            privateProperties.eventBus,
            options.interaction,
        );
        privateProperties.metricsEventListener = new MetricsEventListener(
            privateProperties.eventBus,
            options.channel,
            options.metrics,
        );

        this.setLocale(options.locale);
        privateProperties.requestFactory.origin = options.origin;

        let resourceName;

        for (resourceName in options.resources) {
            privateProperties.requestFactory.addDefaultResource(resourceName, options.resources[resourceName]);
        }

        window.addEventListener('resize', () => {
            const banners = privateProperties.bannerManager.getBannersByState({
                state: privateProperties.bannerManager.STATE.RENDERED,
                managed: true,
                external: false,
            });

            for (let i in banners) {
                if (!banners[i].needRedraw()) {
                    continue;
                }

                this.renderBanner(banners[i]);
            }
        });

        privateProperties.metricsEventListener.attach();
        privateProperties.bannerInterractionWatcher.start();
    }

    on(event, callback, scope = null) {
        return internal(this).eventBus.subscribe(event, callback, scope);
    }

    setLocale(locale) {
        internal(this).requestFactory.locale = locale;
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

    createBanner(element, position, resources = {}) {
        return internal(this).bannerManager.addManagedBanner(element, position, resources);
    }

    attachBanners(snippet = document) {
        const privateProperties = internal(this);
        const elements = snippet.querySelectorAll('[data-amp-banner]:not([data-amp-attached])');

        for (let element of elements) {
            let banner;

            if ('ampBannerExternal' in element.dataset) {
                banner = internal(this).bannerManager.addExternalBanner(element);
            } else {
                const position = element.getAttribute('data-amp-banner');
                const resources = {};

                if (!position) {
                    continue; // the empty position, throw an error?
                }

                const attributes = [].filter.call(element.attributes, attr => {
                    return /^data-amp-resource-[\S]+/.test(attr.name);
                });

                for (let attr of attributes) {
                    if (attr.value) {
                        resources[attr.name.slice(18)] = attr.value.split(',').map(v => v.trim());
                    }
                }

                banner = this.createBanner(element, position, resources);
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
            privateProperties.bannerRenderer.render(banner);
        } catch (e) {
            banner.setState(privateProperties.bannerManager.STATE.ERROR, 'Render error: ' + e.message);

            return;
        }

        banner.setState(privateProperties.bannerManager.STATE.RENDERED, 'Banner was successfully rendered.');
    }
}

module.exports = Client;
