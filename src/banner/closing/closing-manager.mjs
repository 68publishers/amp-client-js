import { Events } from '../../event/events.mjs';
import { EmbedBanner } from '../embed/embed-banner.mjs';
import { ClosedBannerStore } from './closed-banner-store.mjs';
import { ClosingEntry, EntryKey } from './closing-entry.mjs';
import { Fingerprint } from '../fingerprint.mjs';

export class ClosingManager {
    #bannerManager;
    #eventBus;
    #bannerFrameMessenger;
    #parentFrameMessenger;
    #store;

    constructor({
        bannerManager,
        eventBus,
        config = {
            storage: 'memoryStorage',
            key: 'amp-closed-banners',
            maxItems: 500,
        },
        bannerFrameMessenger = undefined,
        parentFrameMessenger = undefined,
    }) {
        this.#bannerManager = bannerManager;
        this.#eventBus = eventBus;
        this.#bannerFrameMessenger = bannerFrameMessenger;
        this.#parentFrameMessenger = parentFrameMessenger;

        const { storage, key, maxItems } = config;
        this.#store = new ClosedBannerStore({
            storage,
            key,
            maxItems,
            onExternalChange: keys => {
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];

                    if (key.isBanner()) {
                        this.closeBanner(key.args.positionCode, key.args.bannerId);
                    }
                }
            },
        });

        if (this.#bannerFrameMessenger) {
            this.#bannerFrameMessenger.on('storeClosedEntries', ({ data }) => {
                const { uid, entries, fingerprints } = data;
                const banner = this.#bannerManager.getBannerByUid(uid);

                if (!(banner instanceof EmbedBanner)) {
                    return;
                }

                for (let i = 0; i < fingerprints.length; i++) {
                    banner.unsetFingerprint(Fingerprint.createFromValue(fingerprints[i]));
                }

                this.#store.close(entries.map(e => new ClosingEntry({ key: EntryKey.tryParse(e.key), expiresAt: e.expiresAt })));
            });
        }

        if (this.#parentFrameMessenger) {
            this.#parentFrameMessenger.on('closeBanner', ({ data }) => {
                const { positionCode, bannerId } = data;

                positionCode && bannerId && this.closeBanner(positionCode, bannerId);
            });
        }
    }

    attachUi() {
        const attachClickEvent = ({ banner, button }) => {
            if (button._ampCloseActionAttached) {
                return;
            }

            button._ampCloseActionAttached = true;

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
                        this.closeBanner(banner.position, bannerFingerprint.bannerId);
                    }
                }
            });
        };

        this.#eventBus.subscribe(Events.ON_BANNER_STATE_CHANGED, ({ banner }) => {
            if (banner.state === banner.STATE.RENDERED) {
                Array.from(banner.element.querySelectorAll('[data-amp-banner-close]')).forEach(button => {
                    attachClickEvent({ banner, button });
                });
            } else if (banner.state === banner.STATE.CLOSED) {
                banner.element.innerHTML = '';
            }
        }, null, -100);

        this.#eventBus.subscribe(Events.ON_BANNER_MUTATED, ({ banner, mutation }) => {
            if (banner.state !== banner.STATE.RENDERED) {
                return;
            }

            if (0 < mutation.addedNodes.length) {
                Array.from(banner.element.querySelectorAll('[data-amp-banner-close]')).forEach(button => {
                    attachClickEvent({ banner, button });
                });
            }

            if (mutation.attributeName) {
                attachClickEvent({ banner, button: mutation.target });
            }
        });
    }

    isBannerClosed(positionCode, bannerId) {
        return this.#store.isClosed(
            EntryKey.banner(positionCode, bannerId),
        );
    }

    isPositionClosed(positionCode) {
        return this.#store.isClosed(
            EntryKey.position(positionCode),
        );
    }

    closeBanner(positionCode, bannerId) {
        const banner = this.#bannerManager.getBannerByPosition(positionCode);

        if (null === banner) {
            return;
        }

        const allFingerprints = [...banner.fingerprints];
        const fingerprint = allFingerprints.filter(f => f.bannerId === bannerId)[0];

        if (undefined === fingerprint) {
            return;
        }

        if (banner instanceof EmbedBanner) {
            this.#bannerFrameMessenger && (this.#bannerFrameMessenger.sendToBanner(
                banner,
                'closeBanner',
                {
                    positionCode: positionCode,
                    bannerId: bannerId,
                },
            ));

            return;
        }

        const bannerExpiration = fingerprint.closeExpiration;

        this.#closeFingerprint({ banner, fingerprint }).then(() => {
            const entries = [];

            entries.push(ClosingEntry.banner({
                positionCode,
                bannerId,
                closingExpiration: bannerExpiration,
            }));

            if (null !== banner.positionData.closeExpiration) {
                const promises = [];
                const fingerprints = banner.fingerprints;

                for (let i = 0; i < fingerprints.length; i++) {
                    promises.push(this.#closeFingerprint({ banner, fingerprint: fingerprints[i] }));
                }

                Promise.all(promises).then(() => {
                    entries.push(ClosingEntry.position({
                        positionCode,
                        closingExpiration: banner.positionData.closeExpiration,
                    }));

                    setTimeout(() => this.#store.close(entries), 0);
                    this.#parentFrameMessenger && this.#parentFrameMessenger.sendToParent('storeClosedEntries', {
                        entries: entries.map(e => ({ key: e.key.toString(), expiresAt: e.expiresAt })),
                        fingerprints: allFingerprints.map(f => f.toString()),
                    });
                });
            } else {
                setTimeout(() => this.#store.close(entries), 0);
                this.#parentFrameMessenger && this.#parentFrameMessenger.sendToParent('storeClosedEntries', {
                    entries: entries.map(e => ({ key: e.key.toString(), expiresAt: e.expiresAt })),
                    fingerprints: [fingerprint.toString()],
                });
            }
        });
    }

    #closeFingerprint({ banner, fingerprint }) {
        const element = banner.element.querySelector(`[data-amp-banner-fingerprint="${fingerprint.value}"]`);

        if (!element) {
            return Promise.resolve(undefined);
        }

        let operation = (element) => element.remove();
        const setOperation = (op) => operation = op;

        this.#eventBus.dispatch(Events.ON_BANNER_BEFORE_CLOSE, {
            fingerprint,
            element,
            banner,
            setOperation,
        });

        return Promise.resolve(operation(element)).then(() => {
            this.#eventBus.dispatch(Events.ON_BANNER_AFTER_CLOSE, {
                fingerprint,
                element,
                banner,
            });

            banner.unsetFingerprint(fingerprint);
        });
    }
}
