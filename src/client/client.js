const _ = require('lodash');
const internal = require('../utils/internal-state')();
const _config = require('../config/index');
const _gateway = require('../gateway/index');
const RequestFactory = require('../request/request-factory');
const BannerManager = require('../banner/banner-manager');
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
            options.channel
        );

        privateProperties.bannerManager = new BannerManager(privateProperties.eventBus);
        privateProperties.bannerRenderer = new BannerRenderer(options.template);
        privateProperties.bannerInterractionWatcher = new BannerInteractionWatcher(
            privateProperties.bannerManager,
            privateProperties.eventBus,
            options.interaction
        );
        privateProperties.metricsEventListener = new MetricsEventListener(
            privateProperties.eventBus,
            options.channel,
            options.metrics,
        );

        this.setLocale(options.locale);

        let resourceName;

        for (resourceName in options.resources) {
            if (options.resources.hasOwnProperty(resourceName)) {
                privateProperties.requestFactory.addDefaultResource(resourceName, options.resources[resourceName]);
            }
        }

        window.addEventListener('resize', () => {
            const banners = privateProperties.bannerManager.getBannersByState(privateProperties.bannerManager.STATE.RENDERED);

            for (let i in banners) {
                if (!banners.hasOwnProperty(i) || !banners[i].needRedraw()) {
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
        if (!this.hasOwnProperty('gateway')) {
            this.setGateway(_gateway.create());
        }

        return internal(this).gateway;
    }

    createBanner(element, position, resources = {}) {
        return internal(this).bannerManager.addBanner(element, position, resources);
    }

    attachBanners(snippet = document) {
        const privateProperties = internal(this);

        _.forEach(snippet.querySelectorAll('[data-amp-banner]:not([data-amp-attached])'), element => {
            const position = element.getAttribute('data-amp-banner');
            const resources = {};

            if (!position) {
                return; // the empty position, throw an error?
            }

            _.forEach(
                [].filter.call(element.attributes, attr => {
                    return /^data-amp-resource-[\S]+/.test(attr.name);
                }),
                attr => {
                    if (!attr.value) {
                        return;
                    }

                    resources[attr.name.slice(18)] = _.map(attr.value.split(','), _.trim);
                }
            );
            privateProperties.eventBus.dispatch(this.EVENTS.ON_BANNER_ATTACHED, this.createBanner(element, position, resources));
        });
    }

    fetch() {
        const privateProperties = internal(this);
        const banners = privateProperties.bannerManager.getBannersByState(privateProperties.bannerManager.STATE.NEW);

        if (!banners.length) {
            return;
        }

        const request = privateProperties.requestFactory.create();

        _.forEach(banners, (banner) =>  {
            request.addPosition(banner.position, banner.resources)
        });

        const success = (response) => {
            const data = response.data;

            _.forEach(banners, (banner) =>  {
                if (!data.hasOwnProperty(banner.position)
                    || !data[banner.position].hasOwnProperty('banners')
                    || _.isEmpty(data[banner.position]['banners'])) {

                    banner.setState(privateProperties.bannerManager.STATE.NOT_FOUND, 'Banner not found in fetched response.');

                    return;
                }

                banner.setResponseData(data[banner.position]);
                this.renderBanner(banner);
            });

            privateProperties.eventBus.dispatch(this.EVENTS.ON_FETCH_SUCCESS, response);
        };

        const error = (response) => {
            _.forEach(banners, (banner) =>  {
                banner.setState(privateProperties.bannerManager.STATE.ERROR, 'Request on api failed.');
            });

            privateProperties.eventBus.dispatch(this.EVENTS.ON_FETCH_ERROR, response);
        };

        privateProperties.eventBus.dispatch(this.EVENTS.ON_BEFORE_FETCH);
        this.getGateway().fetch(request, success, error);
    }

    renderBanner(banner) {
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
