'use strict';

(function (document, _, _config, _gateway, RequestFactory, BannerManager, EventBus, Events, BannerRenderer) {

    class Client {

        constructor (options) {
            // constants
            this.EVENTS = Events;

            options = _config(options);
            this._eventBus = new EventBus();
            this._requestFactory = new RequestFactory(
                options.url,
                options.version,
                options.channel
            );
            this._bannerManager = new BannerManager(this._eventBus);
            this._bannerRenderer = new BannerRenderer(options.template);

            this.setLocale(options.locale);

            let resourceName;
            for (resourceName in options.resources) {
                if (options.resources.hasOwnProperty(resourceName)) {
                    this._requestFactory.addDefaultResource(resourceName, options.resources[resourceName]);
                }
            }
        }

        on(event, callback, scope = null) {
            return this._eventBus.subscribe(event, callback, scope);
        }

        setLocale(locale) {
            this._requestFactory.setLocale(locale);
        }

        setGateway(gateway) {
            if (!_gateway.isGateway(gateway)) {
                throw new TypeError('Argument gateway mut be instance of AbstractGateway.');
            }

            this._gateway = gateway;
        }

        getGateway() {
            if (!this.hasOwnProperty('gateway')) {
                this.setGateway(_gateway.create());
            }

            return this._gateway;
        }

        createBanner(element, position, resources = {}) {
            return this._bannerManager.addBanner(element, position, resources);
        }

        attachBanners(snippet = document) {
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
                this._eventBus.dispatch(this.EVENTS.ON_BANNER_ATTACHED, this.createBanner(element, position, resources));
            });
        }

        fetch() {
            const banners = this._bannerManager.getBannersByState(this._bannerManager.STATE.NEW);

            if (!banners.length) {
                return;
            }

            const request = this._requestFactory.create();

            _.forEach(banners, (banner) =>  {
                request.addPosition(banner.position, banner.resources)
            });

            const success = (response) => {
                const data = response.data;

                _.forEach(banners, (banner) =>  {
                    if (!data.hasOwnProperty(banner.position)
                        || !data[banner.position].hasOwnProperty('banners')
                        || _.isEmpty(data[banner.position]['banners'])) {

                        banner.setState(this._bannerManager.STATE.NOT_FOUND, 'Banner not found in fetched response.');

                        return;
                    }

                    const position = data[banner.position];
                    const positionInfo = {
                        rotationSeconds: position['rotation_seconds'] || 0,
                        displayType: position['display_type'] || 'unknown'
                    };

                    banner.positionInfo = positionInfo;

                    try {
                        this._bannerRenderer.render(banner, positionInfo, data[banner.position]['banners']);
                    } catch (e) {
                        banner.setState(this._bannerManager.STATE.ERROR, 'Render error: ' + e.message);

                        return;
                    }

                    banner.setState(this._bannerManager.STATE.RENDERED, 'Banner was successfully rendered.');
                });

                this._eventBus.dispatch(this.EVENTS.ON_FETCH_SUCCESS, response);
            };

            const error = (response) => {
                _.forEach(banners, (banner) =>  {
                    banner.setState(this._bannerManager.STATE.ERROR, 'Request on api failed.');
                });

                this._eventBus.dispatch(this.EVENTS.ON_FETCH_ERROR, response);
            };

            this._eventBus.dispatch(this.EVENTS.ON_BEFORE_FETCH);
            this.getGateway().fetch(request, success, error);
        }
    }

    module.exports = Client;

})(
    document,
    require('lodash'),
    require('../config/index'),
    require('../gateway/index'),
    require('../request/request-factory'),
    require('../banner/banner-manager'),
    require('../event/event-bus'),
    require('../event/events'),
    require('../renderer/banner-renderer')
);
