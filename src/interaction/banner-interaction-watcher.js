const State = require('../banner/state');
const Fingerprint = require('../banner/fingerprint');
const Events = require('../event/events');
const internal = require('../utils/internal-state')();

const createBannerFingerprint = (element, fingerprint) => {
    return {
        element: element,
        fingerprint: Fingerprint.createFromValue(fingerprint),
        alreadySeen: false,
        firstSeenTimeoutId: null,
    };
}

class BannerInteractionWatcher {
    constructor (bannerManager, eventBus, interactionOptions) {
        const firstSeenTimeout = interactionOptions.firstSeenTimeout;
        const intersectionThreshold = interactionOptions.intersectionThreshold

        internal(this).started = false;
        internal(this).bannerManager = bannerManager;
        internal(this).eventBus = eventBus;
        internal(this).fingerprints = {};
        internal(this).observer = new IntersectionObserver(entries => {
            for (let entry of entries) {
                const isIntersecting = entry.isIntersecting;
                const fingerprint = entry.target.dataset.ampBannerFingerprint;
                const banner = internal(this).bannerManager.getBannerByFingerprint(fingerprint);

                if (!banner) {
                    continue;
                }

                const fingerprintMetadata = internal(this).fingerprints[fingerprint];

                if (!fingerprintMetadata) {
                    continue;
                }

                const fingerprintArgs = {
                    fingerprint: fingerprintMetadata.fingerprint,
                    element: fingerprintMetadata.element,
                    banner: banner,
                }

                if (isIntersecting && !fingerprintMetadata.alreadySeen && null === fingerprintMetadata.firstSeenTimeoutId) {
                    fingerprintMetadata.firstSeenTimeoutId = setTimeout(() => {
                        fingerprintMetadata.alreadySeen = true;
                        internal(this).eventBus.dispatch(Events.ON_BANNER_FIRST_SEEN, fingerprintArgs);
                    }, firstSeenTimeout);
                } else if (!isIntersecting && !fingerprintMetadata.alreadySeen && null !== fingerprintMetadata.firstSeenTimeoutId) {
                    clearTimeout(fingerprintMetadata.firstSeenTimeoutId);
                    fingerprintMetadata.firstSeenTimeoutId = null;
                }

                internal(this).eventBus.dispatch(Events.ON_BANNER_INTERSECTION_CHANGED, {
                    ...fingerprintArgs,
                    entry,
                });
            }
        }, {
            threshold: intersectionThreshold,
        });
    }

    start() {
        if (internal(this).started) {
            return;
        }

        const self = this;
        internal(this).started = true;

        internal(self).eventBus.subscribe(Events.ON_BANNER_STATE_CHANGED, banner => {
            if (State.RENDERED !== banner.state) {
                return;
            }

            const elements = banner.element.querySelectorAll('[data-amp-banner-fingerprint]');

            for (let element of elements) {
                const fingerprint = element.dataset.ampBannerFingerprint;

                if (!(fingerprint in internal(self).fingerprints)) {
                    internal(self).fingerprints[fingerprint] = createBannerFingerprint(element, fingerprint);
                    internal(self).observer.observe(element);
                }

                const linkElements = element.getElementsByTagName('a');

                for (let linkElement of linkElements) {
                    linkElement.addEventListener('click', function(event) {
                        const fingerprintMetadata = internal(self).fingerprints[fingerprint];

                        if (!fingerprintMetadata) {
                            console.warn(`Unable to invoke an event "amp:banner:link-clicked" because the fingerprint "${fingerprint}" not managed.`);
                            return;
                        }

                        const banner = internal(self).bannerManager.getBannerByFingerprint(fingerprint);

                        if (!banner) {
                            console.warn(`Unable to invoke an event "amp:banner:link-clicked" because the banner for fingerprint "${fingerprint}" not found.`);
                            return;
                        }

                        const fingerprintArgs = {
                            fingerprint: fingerprintMetadata.fingerprint,
                            element: fingerprintMetadata.element,
                            banner: banner,
                            target: this,
                            clickEvent: event,
                        }

                        // a banner was not visible, but the user clicked on it
                        if (!fingerprintMetadata.alreadySeen) {
                            fingerprintMetadata.alreadySeen = true;
                            internal(self).eventBus.dispatch(Events.ON_BANNER_FIRST_SEEN, fingerprintArgs);
                        }

                        internal(self).eventBus.dispatch(Events.ON_BANNER_LINK_CLICKED, fingerprintArgs);
                    });
                }
            }
        });
    }
}

module.exports = BannerInteractionWatcher;
