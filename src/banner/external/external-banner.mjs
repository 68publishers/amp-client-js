import { Banner } from '../banner.mjs';
import { Fingerprint } from '../fingerprint.mjs';
import { PositionData } from '../position-data.mjs';
import { AttributesParser } from '../attributes-parser.mjs';
import { Contents } from '../responsive/contents.mjs';

export class ExternalBanner extends Banner {
    #fingerprints = [];
    #contentsByBannerId = null;
    #responsiveBehaviourDelegated = false;

    constructor(dimensionsProvider, eventBus, uid, element) {
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
        const contentsByBannerId = {};

        for (let banner of element.querySelectorAll('[data-amp-banner-fingerprint]')) {
            const fingerprint = Fingerprint.createFromValue(banner.dataset.ampBannerFingerprint);

            fingerprints.push(fingerprint);

            for (let content of banner.querySelectorAll('[data-amp-content-breakpoint]')) {
                let breakpoint = content.dataset.ampContentBreakpoint;
                breakpoint = 'default' === breakpoint ? null : parseInt(breakpoint);

                if (!(fingerprint.bannerId in contentsByBannerId)) {
                    contentsByBannerId[fingerprint.bannerId] = new Contents(dimensionsProvider, positionData.breakpointType);
                }

                contentsByBannerId[fingerprint.bannerId].addContent(breakpoint, content);
            }
        }

        this._positionData = positionData;
        this.#fingerprints = fingerprints;
        this.#contentsByBannerId = contentsByBannerId;

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
        const contentsByBannerId = this.#contentsByBannerId;
        const contents = contentsByBannerId[bannerId] || null;

        if (null === contents) {
            return null;
        }

        if (this.#responsiveBehaviourDelegated) {
            return contents.content ? contents.content.breakpoint : null;
        }

        for (let content of contents.contents) {
            const style = getComputedStyle(content.data);

            if ('none' !== style.display) {
                return content.breakpoint;
            }
        }

        return null;
    }

    isExternal() {
        return true;
    }

    delegateResponsiveBehaviour() {
        if (this.#responsiveBehaviourDelegated) {
            return;
        }

        this.#responsiveBehaviourDelegated = true;
        const styles = this.element.querySelectorAll('style');

        for (let style of styles) {
            style.remove();
        }

        this.redrawIfNeeded();
    }

    redrawIfNeeded() {
        if (!this.#responsiveBehaviourDelegated) {
            return;
        }

        for (let bannerId in this.#contentsByBannerId) {
            const contents = this.#contentsByBannerId[bannerId];

            if (!contents.needRedraw()) {
                continue;
            }

            const currentContent = contents.content;

            for (let content of contents.contents) {
                content.data.style.display = content === currentContent ? 'block' : 'none';
            }
        }
    }
}
