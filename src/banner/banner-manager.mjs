import { ManagedBanner } from './managed/managed-banner.mjs';
import { ExternalBanner } from './external/external-banner.mjs';
import { EmbedBanner } from './embed/embed-banner.mjs';
import { Banner } from './banner.mjs';
import { State } from './state.mjs';
import { Fingerprint } from './fingerprint.mjs';
import { SequenceGenerator } from '../utils/sequence-generator.mjs';
import { getHtmlElement } from '../utils/dom-helpers.mjs';

export class BannerManager {
    #eventBus;
    #dimensionsProvider;
    #bannerRenderer;
    #sequenceGenerator;
    #banners = [];

    /**
     * @param {EventBus} eventBus
     * @param {DimensionsProvider} dimensionsProvider
     * @param {BannerRenderer|null} bannerRenderer
     */
    constructor(
        eventBus,
        dimensionsProvider,
        bannerRenderer = null,
    ) {
        this.#eventBus = eventBus;
        this.#dimensionsProvider = dimensionsProvider;
        this.#bannerRenderer = bannerRenderer;
        this.#sequenceGenerator = new SequenceGenerator();

        this.STATE = State;
    }

    addExternalBanner(element, refWindow = window) {
        element = getHtmlElement(element, refWindow);

        element.setAttribute('data-amp-attached', '');

        const banner = new ExternalBanner(
            this.#dimensionsProvider,
            this.#eventBus,
            this.#sequenceGenerator.getNextIdentifier(),
            element,
        );

        this.#banners.push(banner);

        return banner;
    }

    addManagedBanner(element, position, resources = {}, options = {}, refWindow = window) {
        if (null === this.#bannerRenderer) {
            throw new Error(`Unable to add managed banner, renderer is not provided.`);
        }

        element = getHtmlElement(element, refWindow);

        element.setAttribute('data-amp-attached', '');

        const banner = new ManagedBanner(
            this.#dimensionsProvider,
            this.#bannerRenderer,
            this.#eventBus,
            this.#sequenceGenerator.getNextIdentifier(),
            element,
            position,
            resources,
            options,
        );

        this.#banners.push(banner);

        return banner;
    }

    addEmbedBanner(element, iframe, position, options) {
        element = getHtmlElement(element, window);
        iframe = getHtmlElement(iframe, window);

        element.setAttribute('data-amp-attached', '');

        const banner = new EmbedBanner(
            this.#eventBus,
            this.#sequenceGenerator.getNextIdentifier(),
            element,
            iframe,
            position,
            options,
        );

        this.#banners.push(banner);

        return banner;
    }

    removeBanner(banner) {
        const length = this.#banners.length;
        this.#banners = this.#banners.filter(b => b !== banner);

        return length !== this.#banners.length;
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
            if (banner instanceof EmbedBanner) {
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
}
