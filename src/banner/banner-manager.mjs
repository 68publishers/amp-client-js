import { ManagedBanner } from './managed/managed-banner.mjs';
import { ExternalBanner } from './external/external-banner.mjs';
import { EmbedBanner } from './embed/embed-banner.mjs';
import { Banner } from './banner.mjs';
import { State } from './state.mjs';
import { Fingerprint } from './fingerprint.mjs';
import { Resource } from '../request/resource.mjs';
import { SequenceGenerator } from '../utils/sequence-generator.mjs';

export class BannerManager {
    #eventBus;
    #sequenceGenerator;
    #banners = [];

    constructor(eventBus) {
        this.#eventBus = eventBus;
        this.#sequenceGenerator = new SequenceGenerator();

        this.STATE = State;
    }

    addExternalBanner(element) {
        element = this.#getElement(element);

        element.setAttribute('data-amp-attached', '');

        const banner = new ExternalBanner(
            this.#eventBus,
            this.#sequenceGenerator.getNextIdentifier(),
            element,
        );

        this.#banners.push(banner);

        return banner;
    }

    addManagedBanner(element, position, resources = {}, options = {}) {
        const resourceArr = [];
        let key;
        element = this.#getElement(element);

        element.setAttribute('data-amp-attached', '');

        for (key in resources) {
            resourceArr.push(new Resource(key, resources[key]));
        }

        const banner = new ManagedBanner(
            this.#eventBus,
            this.#sequenceGenerator.getNextIdentifier(),
            element,
            position,
            resourceArr,
            options,
        );

        this.#banners.push(banner);

        return banner;
    }

    addEmbedBanner(iframe, position, options) {
        iframe = this.#getElement(iframe);

        iframe.setAttribute('data-amp-attached', '');

        const banner = new EmbedBanner(
            this.#eventBus,
            this.#sequenceGenerator.getNextIdentifier(),
            iframe,
            position,
            options,
        );

        this.#banners.push(banner);

        return banner;
    }

    getBannersByState({state, managed = true, external = true, embed = true}) {
        return this.#banners.filter(banner => {
            if (!(banner instanceof Banner) || banner.state !== state) {
                return false;
            }

            return !((banner instanceof ManagedBanner && !managed) || (banner instanceof ExternalBanner && !external) || (banner instanceof EmbedBanner && !embed));
        });
    }

    getBannerByFingerprint(fingerprint) {
        const fingerprintValue = fingerprint instanceof Fingerprint ? fingerprint.value : fingerprint;

        for (let banner of this.#banners) {
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
        for (let banner of this.#banners) {
            if (banner.uid === uid) {
                return banner;
            }
        }

        return null;
    }

    #getElement(el) {
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
    }
}
