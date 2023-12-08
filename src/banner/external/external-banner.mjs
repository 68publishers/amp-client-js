import { Banner } from '../banner.mjs';
import { Fingerprint } from '../fingerprint.mjs';
import { PositionData } from '../position-data.mjs';
import { AttributesParser } from '../attributes-parser.mjs';

export class ExternalBanner extends Banner {
    #fingerprints = [];
    #breakpointsByBannerId = {};

    constructor(eventBus, uid, element) {
        if (!('ampBannerExternal' in element.dataset)) {
            throw new Error(`Unable to initialize ExternalBanner from element that does not have an attribute "data-amp-external".`);
        }

        const externalData = JSON.parse(decodeURIComponent(atob(element.dataset.ampBannerExternal)));

        if (!('state' in externalData) || !('positionData' in externalData)) {
            throw new Error(`Unable to initialize ExternalBanner data attribute "data-amp-external" is malformed.`);
        }

        const state = externalData.state;
        const positionData = new PositionData(externalData.positionData);
        const options = AttributesParser.parseOptions(element);

        super(eventBus, uid, element, positionData.code, options);

        const fingerprints = [];
        const breakpointsByBannerId = {};

        for (let banner of element.querySelectorAll('[data-amp-banner-fingerprint]')) {
            const fingerprint = Fingerprint.createFromValue(banner.dataset.ampBannerFingerprint);

            fingerprints.push(fingerprint);

            for (let content of banner.querySelectorAll('[data-amp-content-breakpoint]')) {
                let breakpoint = content.dataset.ampContentBreakpoint;
                breakpoint = 'default' === breakpoint ? null : parseInt(breakpoint);

                if (!(fingerprint.bannerId in breakpointsByBannerId)) {
                    breakpointsByBannerId[fingerprint.bannerId] = [];
                }

                breakpointsByBannerId[fingerprint.bannerId].push({
                    breakpoint: breakpoint,
                    element: content,
                })
            }
        }

        this._positionData = positionData;
        this.#fingerprints = fingerprints;
        this.#breakpointsByBannerId = breakpointsByBannerId;

        this.setState(state.value, state.info);
    }

    /**
     * @returns {Array<Fingerprint>}
     */
    get fingerprints() {
        return this.#fingerprints;
    }

    /**
     * @returns {number|null}
     */
    getCurrenBreakpoint(bannerId) {
        const breakpointsByBannerId = this.#breakpointsByBannerId;
        const breakpoints = breakpointsByBannerId[bannerId] || [];

        for (let breakpoint of breakpoints) {
            const style = getComputedStyle(breakpoint.element);

            if ('none' !== style.display) {
                return breakpoint.breakpoint;
            }
        }

        return null;
    }

    isExternal() {
        return true;
    }
}
