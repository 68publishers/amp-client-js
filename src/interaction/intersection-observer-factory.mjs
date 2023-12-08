import { Events } from '../event/events.mjs';

export class IntersectionObserverFactory {
    /**
     * @param {BannerManager} bannerManager
     * @param {EventBus} eventBus
     * @param {Object} fingerprints
     * @param {Number} defaultIntersectionRatio
     * @param {Object} intersectionRatioMap
     * @param {Number} firstTimeSeenTimeout
     */
    static create(bannerManager, eventBus, fingerprints, defaultIntersectionRatio, intersectionRatioMap, firstTimeSeenTimeout) {
        let sortedIntersectionSet = [];

        for (let pixels in intersectionRatioMap) {
            sortedIntersectionSet.push({
                pixels: parseInt(pixels),
                ratio: intersectionRatioMap[pixels],
            });
        }

        sortedIntersectionSet = sortedIntersectionSet.sort((a, b) => b.pixels - a.pixels);

        const resolveIntersectionRatio = element => {
            const style = getComputedStyle(element);
            const width = element.offsetWidth - (parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)) - (parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth));
            const height = element.offsetHeight - (parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)) - (parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth));
            const pixels = width * height;

            for (let item of sortedIntersectionSet) {
                if (pixels >= item.pixels) {
                    return item.ratio;
                }
            }

            return defaultIntersectionRatio;
        }

        return new IntersectionObserver(entries => {
            const intersectionChangesEventArgs = [];
            let firstTimeSeenMetadata = {};
            let firstTimeFullySeenMetadata = {};

            for (let entry of entries) {
                const fingerprint = entry.target.dataset.ampBannerFingerprint;
                const banner = bannerManager.getBannerByFingerprint(fingerprint);

                if (!banner) {
                    continue;
                }

                const fingerprintMetadata = fingerprints[fingerprint];

                if (!fingerprintMetadata) {
                    continue;
                }

                const fingerprintArgs = {
                    fingerprint: fingerprintMetadata.fingerprint,
                    element: entry.target,
                    banner: banner,
                }

                intersectionChangesEventArgs.push({
                    ...fingerprintArgs,
                    entry,
                });

                if (!fingerprintMetadata.alreadySeen) {
                    const isIntersecting = entry.intersectionRatio >= resolveIntersectionRatio(entry.target);

                    firstTimeSeenMetadata[fingerprint] = (!(fingerprint in firstTimeSeenMetadata) || (!firstTimeSeenMetadata[fingerprint].isIntersecting && isIntersecting))
                        ? { fingerprintArgs, fingerprintMetadata, isIntersecting }
                        : firstTimeSeenMetadata[fingerprint];
                }

                if (!fingerprintMetadata.alreadyFullySeen) {
                    const isFullyIntersecting = 1 <= entry.intersectionRatio;

                    firstTimeFullySeenMetadata[fingerprint] = (!(fingerprint in firstTimeFullySeenMetadata) || (!firstTimeFullySeenMetadata[fingerprint].isFullyIntersecting && isFullyIntersecting))
                        ? { fingerprintArgs, fingerprintMetadata, isFullyIntersecting }
                        : firstTimeFullySeenMetadata[fingerprint];
                }
            }

            for (let firstTimeSeenRow of Object.values(firstTimeSeenMetadata)) {
                const { fingerprintArgs, fingerprintMetadata, isIntersecting } = firstTimeSeenRow;

                if (isIntersecting && !fingerprintMetadata.alreadySeen && null === fingerprintMetadata.firstTimeSeenTimeoutId) {
                    fingerprintMetadata.firstTimeSeenTimeoutId = setTimeout(() => {
                        fingerprintMetadata.alreadySeen = true;
                        eventBus.dispatch(Events.ON_BANNER_FIRST_TIME_SEEN, fingerprintArgs);
                    }, firstTimeSeenTimeout);
                } else if (!isIntersecting && null !== fingerprintMetadata.firstTimeSeenTimeoutId) {
                    clearTimeout(fingerprintMetadata.firstTimeSeenTimeoutId);
                    fingerprintMetadata.firstTimeSeenTimeoutId = null;
                }
            }

            for (let firstTimeFullySeenRow of Object.values(firstTimeFullySeenMetadata)) {
                const { fingerprintArgs, fingerprintMetadata, isFullyIntersecting } = firstTimeFullySeenRow;

                if (isFullyIntersecting && !fingerprintMetadata.alreadyFullySeen && null === fingerprintMetadata.firstTimeFullySeenTimeoutId) {
                    fingerprintMetadata.firstTimeFullySeenTimeoutId = setTimeout(() => {
                        fingerprintMetadata.alreadyFullySeen = true;
                        eventBus.dispatch(Events.ON_BANNER_FIRST_TIME_FULLY_SEEN, fingerprintArgs);
                    }, firstTimeSeenTimeout);
                } else if (!isFullyIntersecting && null !== fingerprintMetadata.firstTimeFullySeenTimeoutId) {
                    clearTimeout(fingerprintMetadata.firstTimeFullySeenTimeoutId);
                    fingerprintMetadata.firstTimeFullySeenTimeoutId = null;
                }
            }

            for (let eventArgs of intersectionChangesEventArgs) {
                eventBus.dispatch(Events.ON_BANNER_INTERSECTION_CHANGED, eventArgs);
            }
        }, {
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        });
    }
}
