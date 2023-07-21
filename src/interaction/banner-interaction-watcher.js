const State = require('../banner/state');
const Fingerprint = require('../banner/fingerprint');
const Events = require('../event/events');
const internal = require('../utils/internal-state')();
const intersectionObserverFactory = require('./intersection-observer-factory');

class BannerInteractionWatcher {
    constructor (bannerManager, eventBus, interactionOptions) {
        internal(this).started = false;
        internal(this).bannerManager = bannerManager;
        internal(this).eventBus = eventBus;
        internal(this).fingerprints = {};
        internal(this).intersectionObserver = intersectionObserverFactory(
            bannerManager,
            eventBus,
            internal(this).fingerprints,
            interactionOptions.defaultIntersectionRatio,
            interactionOptions.intersectionRatioMap,
            interactionOptions.firstTimeSeenTimeout,
        );
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

                // save new fingerprint is does not exist
                if (!(fingerprint in internal(self).fingerprints)) {
                    internal(self).fingerprints[fingerprint] = {
                        fingerprint: Fingerprint.createFromValue(fingerprint),
                        alreadySeen: false,
                        alreadyFullySeen: false,
                        firstTimeSeenTimeoutId: null,
                        firstTimeFullySeenTimeoutId: null,
                    };
                }

                // when fingerprint element is not attached yet
                if (undefined === element.dataset.ampBannerFingerprintObserved) {
                    // wait for all images to be completed or failed
                    Promise.all(
                        [].slice.call(element.getElementsByTagName('img'))
                            .filter(img => !img.complete)
                            .map(img => new Promise(resolve => { img.onload = img.onerror = resolve; })),
                    ).then(() => {
                        // prevent double observing
                        if (undefined === element.dataset.ampBannerFingerprintObserved) {
                            element.dataset.ampBannerFingerprintObserved = 'true';
                            internal(self).intersectionObserver.observe(element);
                        }
                    });
                }

                const linkElements = element.getElementsByTagName('a');

                for (let linkElement of linkElements) {
                    // prevent multiple events
                    if (undefined !== linkElement.dataset.ampClickingAttached) {
                        continue;
                    }

                    linkElement.dataset.ampClickingAttached = 'true';

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
                            element: this.closest('[data-amp-banner-fingerprint]'),
                            banner: banner,
                            target: this,
                            clickEvent: event,
                        }

                        // a banner was not visible, but the user clicked on it
                        if (!fingerprintMetadata.alreadySeen) {
                            fingerprintMetadata.alreadySeen = true;
                            internal(self).eventBus.dispatch(Events.ON_BANNER_FIRST_TIME_SEEN, fingerprintArgs);
                        }

                        internal(self).eventBus.dispatch(Events.ON_BANNER_LINK_CLICKED, fingerprintArgs);
                    });
                }
            }
        }, null, -100);
    }
}

module.exports = BannerInteractionWatcher;
