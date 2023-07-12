const _ = require('lodash');
const internal = require('../utils/internal-state')();
const Banner = require('./banner');
const State = require('./state');
const Fingerprint = require('./fingerprint');
const Resource = require('../request/resource');

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
            return banner instanceof Banner && banner.state === state;
        });
    }

    getBannerByFingerprint(fingerprint) {
        const fingerprintValue = fingerprint instanceof Fingerprint ? fingerprint.value : fingerprint;

        for (let banner of internal(this).banners) {
            for (let ft of banner.fingerprints) {
                if (ft.value === fingerprintValue) {
                    return banner;
                }
            }
        }

        return null;
    }
}

module.exports = BannerManager;
