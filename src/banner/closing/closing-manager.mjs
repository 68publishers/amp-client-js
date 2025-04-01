import { Events } from '../../event/events.mjs';
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
            external: {
                cookieName: null,
            },
        },
        bannerFrameMessenger = undefined,
        parentFrameMessenger = undefined,
    }) {
        this.#bannerManager = bannerManager;
        this.#eventBus = eventBus;
        this.#bannerFrameMessenger = bannerFrameMessenger;
        this.#parentFrameMessenger = parentFrameMessenger;

        const { storage, key, maxItems, external } = config;

        this.#store = new ClosedBannerStore({
            storage,
            key,
            maxItems,
            externalOptions: external,
            onStorageChange: keys => {
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];

                    if (key.isBanner()) {
                        this.closeBanner(key.args.positionCode, key.args.bannerId, {});
                    }
                }
            },
        });

        if (this.#bannerFrameMessenger) {
            this.#bannerFrameMessenger.on('storeClosedEntries', ({ data }) => {
                const { uid, entries, fingerprints } = data;
                const banner = this.#bannerManager.getBannerByUid(uid);

                if (!banner.isEmbed()) {
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
                const { positionCode, bannerId, options } = data;

                positionCode && bannerId && this.closeBanner(positionCode, bannerId, options || {});
            });
        }
    }

    setRevision(revision) {
        this.#store.setRevision(revision);
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
                        this.closeBanner(banner.position, bannerFingerprint.bannerId, {
                            animation: button.dataset.ampBannerClose || undefined,
                        });
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

    closeBanner(positionCode, bannerId, { animation = undefined }) {
        const banner = this.#bannerManager.getBannerByPosition(positionCode);

        if (null === banner) {
            return;
        }

        const allFingerprints = [...banner.fingerprints];
        const fingerprint = allFingerprints.filter(f => f.bannerId === bannerId)[0];

        if (undefined === fingerprint) {
            return;
        }

        if (banner.isEmbed()) {
            this.#bannerFrameMessenger && (this.#bannerFrameMessenger.sendToBanner(
                banner,
                'closeBanner',
                {
                    positionCode: positionCode,
                    bannerId: bannerId,
                    options: {
                        animation,
                    },
                },
            ));

            return;
        }

        const bannerExpiration = fingerprint.closeExpiration;

        this.#closeFingerprint({ banner, fingerprint, animation }).then(() => {
            const entries = [];

            entries.push(ClosingEntry.banner({
                positionCode,
                bannerId,
                closingExpiration: bannerExpiration,
                metadata: {
                    external: banner.isExternal(),
                },
            }));

            if (null !== banner.positionData.closeExpiration) {
                const promises = [];
                const fingerprints = banner.fingerprints;

                for (let i = 0; i < fingerprints.length; i++) {
                    promises.push(this.#closeFingerprint({ banner, fingerprint: fingerprints[i], animation }));
                }

                Promise.all(promises).then(() => {
                    entries.push(ClosingEntry.position({
                        positionCode,
                        closingExpiration: banner.positionData.closeExpiration,
                        metadata: {
                            external: banner.isExternal(),
                        },
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

    #closeFingerprint({ banner, fingerprint, animation }) {
        const element = banner.element.querySelector(`[data-amp-banner-fingerprint="${fingerprint.value}"]`);

        if (!element) {
            return Promise.resolve(undefined);
        }

        let fn = undefined;
        let options = [];

        if ('string' === typeof animation) {
            const matches = animation.match(/^(?<fn>[a-zA-Z\d]+)(\((?<options>.+)?\))?$/)?.groups ?? {};

            fn = matches.fn ? matches.fn.trim() : undefined;
            options = matches.options && '' !== matches.options.trim() ? matches.options.split(',').map(opt => opt.trim()) : [];
        }

        let operation = this.#resolveOperation(fn, options);

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

    #resolveOperation(fn, options) {
        if ('slideUp' === fn) {
            return (element) => {
                let duration = 200;
                let timingFn = options[1] || 'ease-in-out';

                try {
                    duration = parseInt(options[0] || '200');

                    if (!(duration > 0)) {
                        console.error(`Unable to parse animation duration.`, options[0]);
                        duration = 200;
                    }
                } catch (e) {
                    console.error(`Unable to parse animation duration.`, options[0]);
                }

                element.style.transitionProperty = 'height, margin, padding';
                element.style.transitionDuration = `${duration}ms`;
                element.style.transitionTimingFunction = timingFn;
                element.style.boxSizing = 'border-box';
                element.style.height = element.offsetHeight + 'px';
                element.offsetHeight;
                element.style.overflow = 'hidden';
                element.style.height = '0';
                element.style.paddingTop = '0';
                element.style.paddingBottom = '0';
                element.style.marginTop = '0';
                element.style.marginBottom = '0';

                return new Promise(resolve => {
                    setTimeout(resolve, duration);
                });
            };
        }

        return (element) => element.remove();
    }
}
