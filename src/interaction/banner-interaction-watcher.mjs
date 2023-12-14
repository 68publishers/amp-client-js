import { State } from '../banner/state.mjs';
import { Fingerprint } from '../banner/fingerprint.mjs';
import { Events } from '../event/events.mjs';
import { IntersectionObserverFactory } from './intersection-observer-factory.mjs';

export class BannerInteractionWatcher {
    #started;
    #bannerManager;
    #eventBus;
    #fingerprints;
    #intersectionObserver;

    /**
     * @param {BannerManager} bannerManager
     * @param {EventBus} eventBus
     * @param {Object} interactionOptions
     */
    constructor (bannerManager, eventBus, interactionOptions) {
        this.#started = false;
        this.#bannerManager = bannerManager;
        this.#eventBus = eventBus;
        this.#fingerprints = {};
        this.#intersectionObserver = IntersectionObserverFactory.create(
            bannerManager,
            eventBus,
            this.#fingerprints,
            interactionOptions.defaultIntersectionRatio,
            interactionOptions.intersectionRatioMap,
            interactionOptions.firstTimeSeenTimeout,
        );
    }

    start() {
        if (this.#started) {
            return;
        }

        this.#started = true;

        this.#eventBus.subscribe(Events.ON_BANNER_STATE_CHANGED, banner => {
            if (State.RENDERED === banner.state && !banner.isEmbed()) {
                this.#watchBanner(banner);
            }
        }, null, -100);

        const banners = this.#bannerManager.getBannersByState({
            state: State.RENDERED,
            embed: false,
        })

        for (let banner of banners) {
            this.#watchBanner(banner);
        }
    }

    /**
     * @param {ManagedBanner|ExternalBanner} banner
     */
    #watchBanner(banner) {
        const self = this;
        const elements = banner.element.querySelectorAll('[data-amp-banner-fingerprint]');

        for (let element of elements) {
            const fingerprint = element.dataset.ampBannerFingerprint;

            // save new fingerprint if it does not exist
            if (!(fingerprint in this.#fingerprints)) {
                this.#fingerprints[fingerprint] = {
                    fingerprint: Fingerprint.createFromValue(fingerprint),
                    alreadySeen: false,
                    alreadyFullySeen: false,
                    firstTimeSeenTimeoutId: null,
                    firstTimeFullySeenTimeoutId: null,
                };
            }

            // when fingerprint element is not attached yet
            if (undefined === element.dataset.ampBannerFingerprintObserved) {
                element.dataset.ampBannerFingerprintObserved = 'true';
                this.#intersectionObserver.observe(element);
            }

            const linkElements = element.getElementsByTagName('a');

            for (let linkElement of linkElements) {
                // prevent multiple events
                if (undefined !== linkElement.dataset.ampClickingAttached) {
                    continue;
                }

                linkElement.dataset.ampClickingAttached = 'true';

                linkElement.addEventListener('click', function (event) {
                    const fingerprintMetadata = self.#fingerprints[fingerprint];

                    if (!fingerprintMetadata) {
                        console.warn(`Unable to invoke an event "amp:banner:link-clicked" because the fingerprint "${fingerprint}" not managed.`);
                        return;
                    }

                    const banner = self.#bannerManager.getBannerByFingerprint(fingerprint);

                    if (!banner) {
                        console.warn(`Unable to invoke an event "amp:banner:link-clicked" because the banner for fingerprint "${fingerprint}" not found.`);
                        return;
                    }

                    const fingerprintArgs = {
                        fingerprint: fingerprintMetadata.fingerprint,
                        element: this.closest('[data-amp-banner-fingerprint]'),
                        banner: banner,
                        target: this,
                        clickEvent: event,
                    }

                    // a banner was not visible, but the user clicked on it
                    if (!fingerprintMetadata.alreadySeen) {
                        fingerprintMetadata.alreadySeen = true;
                        self.#eventBus.dispatch(Events.ON_BANNER_FIRST_TIME_SEEN, fingerprintArgs);
                    }

                    self.#eventBus.dispatch(Events.ON_BANNER_LINK_CLICKED, fingerprintArgs);
                });
            }
        }
    }
}
