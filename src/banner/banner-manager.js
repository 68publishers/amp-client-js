'use strict';

(function (document, _, Banner, State, Resource) {

    const getElement = (el) => {
        if (el instanceof HTMLElement) {
            return el;
        }

        if (typeof el !== 'string') {
            throw new TypeError('Element must be instance of HTMLElement or String');
        }

        let htmlEl;

        if (_.startsWith(el, '#')) {
            htmlEl = document.getElementById(el.slice(1));
        } else {
            htmlEl = document.querySelector(el);
        }

        if (!htmlEl instanceof HTMLElement) {
            throw new TypeError('Selector ' + el + ' is invalid.');
        }

        return htmlEl;
    };

    class BannerManager {

        constructor(eventBus) {
            // constants
            this.STATE = State;

            this._eventBus = eventBus;
            this._banners = [];
        }

        addBanner(element, position, resources = {}) {
            const resourceArr = [];
            let key;
            element = getElement(element);

            element.setAttribute('data-amp-attached', '');

            for (key in resources) {
                if (resources.hasOwnProperty(key)) {
                    resourceArr.push(new Resource(key, resources[key]));
                }
            }

            const banner = new Banner(this._eventBus, element, position, resourceArr);

            this._banners.push(banner);

            return banner;
        }

        getBannersByState(state) {
            return _.filter(this._banners, banner => {
                return banner.getState() === state;
            });
        }
    }

    module.exports = BannerManager;

})(document, require('lodash'), require('./banner'), require('./state'), require('../request/resource'));
