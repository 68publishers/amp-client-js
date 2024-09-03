import { Events } from '../../event/events.mjs';
import { EmbedBanner } from '../embed/embed-banner.mjs';
import { ClosedBannerStore } from './closed-banner-store.mjs';

export class ClosingManager {
    #bannerManager;
    #eventBus;
    #frameMessenger;
    #store;

    constructor({
        bannerManager,
        eventBus,
        config = {
            storage: 'memoryStorage',
            key: 'amp-closed-banners',
            maxItems: 500,
        },
        frameMessenger = undefined,
    }) {
        this.#bannerManager = bannerManager;
        this.#eventBus = eventBus;
        this.#frameMessenger = frameMessenger;

        const { storage, key, maxItems } = config;
        this.#store = new ClosedBannerStore({ storage, key, maxItems });

        if (this.#frameMessenger) {
            this.#frameMessenger.on('bannerClosed', ({ data }) => {
                const { uid, bannerId, fingerprint } = data;
                const banner = this.#bannerManager.getBannerByUid(uid);

                if (!(banner instanceof EmbedBanner)) {
                    return;
                }

                this.#store.persist(bannerId, true);
                banner.unsetFingerprint(fingerprint);
            });
        }
    }

    attachUi() {
        this.#eventBus.subscribe(Events.ON_BANNER_STATE_CHANGED, ({ banner }) => {
            if (banner.state === banner.STATE.RENDERED) {
                Array.from(banner.element.querySelectorAll('[data-amp-banner-close]')).forEach(button => {
                    button.addEventListener('click', event => {
                        event.preventDefault();

                        const fingerprintEl = button.closest('[data-amp-banner-fingerprint]');

                        if (!fingerprintEl) {
                            return;
                        }

                        const fingerprint = fingerprintEl.dataset.ampBannerFingerprint;
                        const bannerFingerprints = banner.fingerprints;

                        for (let i = 0; i < bannerFingerprints.length; i++) {
                            const bannerFingerprint = bannerFingerprints[i];

                            if (bannerFingerprint.value === fingerprint) {
                                this.closeBanner(bannerFingerprint.bannerId);
                            }
                        }
                    });
                });
            } else if (banner.state === banner.STATE.CLOSED) {
                banner.element.innerHTML = '';
            }
        }, null, -100);
    }

    isClosed(bannerId) {
        return this.#store.isClosed(bannerId);
    }

    closeBanner(bannerId) {
        const banners = this.#bannerManager.getBannersByState({
            state: this.#bannerManager.STATE.RENDERED,
        })

        for (let i = 0; i < banners.length; i++) {
            const banner = banners[i];
            const fingerprint = banner.fingerprints.filter(f => f.bannerId === bannerId)[0];

            if (undefined === fingerprint) {
                continue;
            }

            if (banner instanceof EmbedBanner) {
                this.#frameMessenger && (this.#frameMessenger.sendToBanner(
                    banner,
                    'closeBanner',
                    {
                        bannerId: bannerId,
                    },
                ));

                return;
            }

            const element = banner.element.querySelector(`[data-amp-banner-fingerprint="${fingerprint.value}"]`);

            if (!element) {
                continue;
            }

            let operation = (element) => element.remove();
            const setOperation = (op) => operation = op;

            this.#eventBus.dispatch(Events.ON_BANNER_BEFORE_CLOSE, {
                fingerprint,
                element,
                banner,
                setOperation,
            });

            Promise.resolve(operation(element)).then(() => {
                this.#store.persist(bannerId, true);

                this.#eventBus.dispatch(Events.ON_BANNER_AFTER_CLOSE, {
                    fingerprint,
                    element,
                    banner,
                });

                banner.unsetFingerprint(fingerprint);
            });
        }
    }
}
