'use strict';

(function (document, _, internal, Banner, State, Resource) {

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

            internal(this).eventBus = eventBus;
            internal(this).banners = [];
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

            const banner = new Banner(internal(this).eventBus, element, position, resourceArr);

            internal(this).banners.push(banner);

            return banner;
        }

        getBannersByState(state) {
            return _.filter(internal(this).banners, banner => {
                return banner.state === state;
            });
        }
    }

    module.exports = BannerManager;

})(document, require('lodash'), require('../utils/internal-state')(), require('./banner'), require('./state'), require('../request/resource'));
