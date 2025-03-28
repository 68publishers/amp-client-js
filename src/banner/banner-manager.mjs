import { ManagedBanner } from './managed/managed-banner.mjs';
import { ExternalBanner } from './external/external-banner.mjs';
import { EmbedBanner } from './embed/embed-banner.mjs';
import { Banner } from './banner.mjs';
import { State } from './state.mjs';
import { Fingerprint } from './fingerprint.mjs';
import { SequenceGenerator } from '../utils/sequence-generator.mjs';
import { Events } from '../event/events.mjs';
import { getHtmlElement } from '../utils/dom-helpers.mjs';

export class BannerManager {
    #eventBus;
    #dimensionsProvider;
    #bannerRenderer;
    #sequenceGenerator;
    #banners = [];
    #mutationObserver;

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
        this.#mutationObserver = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                if (!(mutation.target instanceof HTMLElement)) {
                    continue;
                }

                const uid = mutation.target.closest('[data-amp-attached]')?.dataset?.ampAttached;
                const banner = undefined !== uid ? this.getBannerByUid(parseInt(uid)) : null;

                if (banner) {
                    this.#eventBus.dispatch(Events.ON_BANNER_MUTATED, { banner, mutation });
                }
            }
        });

        this.STATE = State;
    }

    addExternalBanner(element, refWindow = window) {
        element = getHtmlElement(element, refWindow);
        const uid = this.#sequenceGenerator.getNextIdentifier();

        element.setAttribute('data-amp-attached', uid);

        const banner = new ExternalBanner(
            this.#dimensionsProvider,
            this.#eventBus,
            uid,
            element,
        );

        this.#observeMutations(element);
        this.#banners.push(banner);

        return banner;
    }

    addManagedBanner(element, position, resources = {}, options = {}, refWindow = window) {
        if (null === this.#bannerRenderer) {
            throw new Error(`Unable to add managed banner, renderer is not provided.`);
        }

        element = getHtmlElement(element, refWindow);
        const uid = this.#sequenceGenerator.getNextIdentifier();

        element.setAttribute('data-amp-attached', uid);

        const banner = new ManagedBanner(
            this.#dimensionsProvider,
            this.#bannerRenderer,
            this.#eventBus,
            uid,
            element,
            position,
            resources,
            options,
        );

        this.#observeMutations(element);
        this.#banners.push(banner);

        return banner;
    }

    addEmbedBanner(element, iframe, position, options) {
        element = getHtmlElement(element, window);
        iframe = getHtmlElement(iframe, window);
        const uid = this.#sequenceGenerator.getNextIdentifier();

        element.setAttribute('data-amp-attached', uid);

        const banner = new EmbedBanner(
            this.#eventBus,
            uid,
            element,
            iframe,
            position,
            options,
        );

        this.#observeMutations(element);
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

    getBannerByPosition(positionCode) {
        for (let banner of this.#banners) {
            if (banner.position === positionCode) {
                return banner;
            }
        }

        return null;
    }

    #observeMutations(element) {
        if (!element._ampBannerMutationsObserved) {
            this.#mutationObserver.observe(element, {
                subtree: true,
                childList: true,
                characterData: false,
                attributes: true,
                attributeFilter: [
                    'data-amp-banner-close',
                ],
            });

            element._ampBannerMutationsObserved = true;
        }
    }
}
