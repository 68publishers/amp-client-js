const internal = require('../utils/internal-state');
const ManagedBanner = require('./managed/managed-banner');
const ExternalBanner = require('./external/external-banner');
const EmbedBanner = require('./embed/embed-banner');
const Banner = require('./banner');
const State = require('./state');
const Fingerprint = require('./fingerprint');
const Resource = require('../request/resource');
const SequenceGenerator = require('../utils/sequence-generator');

const getElement = (el) => {
    if (el instanceof HTMLElement) {
        return el;
    }

    if (typeof el !== 'string') {
        throw new TypeError('Element must be instance of HTMLElement or String');
    }

    let htmlEl;

    if ('#' === el.charAt(0)) {
        htmlEl = document.getElementById(el.slice(1));
    } else {
        htmlEl = document.querySelector(el);
    }

    if (!(htmlEl instanceof HTMLElement)) {
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
        internal(this).sequenceGenerator = new SequenceGenerator();
    }

    addExternalBanner(element) {
        element = getElement(element);

        element.setAttribute('data-amp-attached', '');

        const banner = new ExternalBanner(
            internal(this).eventBus,
            internal(this).sequenceGenerator.getNextIdentifier(),
            element,
        );

        internal(this).banners.push(banner);

        return banner;
    }

    addManagedBanner(element, position, resources = {}, options = {}) {
        const resourceArr = [];
        let key;
        element = getElement(element);

        element.setAttribute('data-amp-attached', '');

        for (key in resources) {
            resourceArr.push(new Resource(key, resources[key]));
        }

        const banner = new ManagedBanner(
            internal(this).eventBus,
            internal(this).sequenceGenerator.getNextIdentifier(),
            element,
            position,
            resourceArr,
            options,
        );

        internal(this).banners.push(banner);

        return banner;
    }

    addEmbedBanner(iframe, position, options) {
        iframe = getElement(iframe);

        iframe.setAttribute('data-amp-attached', '');

        const banner = new EmbedBanner(
            internal(this).eventBus,
            internal(this).sequenceGenerator.getNextIdentifier(),
            iframe,
            position,
            options,
        );

        internal(this).banners.push(banner);

        return banner;
    }

    getBannersByState({state, managed = true, external = true, embed = true}) {
        return internal(this).banners.filter(banner => {
            if (!(banner instanceof Banner) || banner.state !== state) {
                return false;
            }

            return !((banner instanceof ManagedBanner && !managed) || (banner instanceof ExternalBanner && !external) || (banner instanceof EmbedBanner && !embed));
        });
    }

    getBannerByFingerprint(fingerprint) {
        const fingerprintValue = fingerprint instanceof Fingerprint ? fingerprint.value : fingerprint;

        for (let banner of internal(this).banners) {
            if (banner in EmbedBanner) {
                continue;
            }

            for (let ft of banner.fingerprints) {
                if (ft.value === fingerprintValue) {
                    return banner;
                }
            }
        }

        return null;
    }

    getBannerByUid(uid) {
        for (let banner of internal(this).banners) {
            if (banner.uid === uid) {
                return banner;
            }
        }

        return null;
    }
}

module.exports = BannerManager;
