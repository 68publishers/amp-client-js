import { Banner } from '../banner.mjs';
import { Fingerprint } from '../fingerprint.mjs';
import { PositionData } from '../position-data.mjs';
import { AttributesParser } from '../attributes-parser.mjs';
import { Contents } from '../responsive/contents.mjs';

export class ExternalBanner extends Banner {
    #fingerprints = [];
    #contentsByBannerId = {};
    #innerRootElement = null;

    constructor(
        dimensionsProvider,
        eventBus,
        uid,
        element
    ) {
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

        const elementClone = element.cloneNode(true);
        const bannerElements = elementClone.querySelectorAll('[data-amp-banner-fingerprint]');

        const bannersListElement = bannerElements.item(0)?.parentElement;
        let innerRootElement = bannersListElement;

        while (null !== innerRootElement && innerRootElement !== elementClone && innerRootElement.parentElement !== elementClone) {
            innerRootElement = innerRootElement.parentElement;
        }

        for (let banner of bannerElements) {
            const fingerprint = Fingerprint.createFromValue(banner.dataset.ampBannerFingerprint);

            fingerprints.push(fingerprint);

            for (let content of banner.querySelectorAll('[data-amp-content-breakpoint]')) {
                let breakpoint = content.dataset.ampContentBreakpoint;
                breakpoint = 'default' === breakpoint ? null : parseInt(breakpoint);

                if (!(fingerprint.bannerId in contentsByBannerId)) {
                    contentsByBannerId[fingerprint.bannerId] = new Contents(dimensionsProvider, positionData.breakpointType);
                }

                const bannerClone = banner.cloneNode(false);

                bannerClone.insertAdjacentElement('afterbegin', content);

                contentsByBannerId[fingerprint.bannerId].addContent(breakpoint, {
                    html: bannerClone.outerHTML,
                });
            }
        }

        bannersListElement && (bannersListElement.dataset.ampBannerList = 'true');
        bannersListElement && (bannersListElement.innerHTML = '');

        this._positionData = positionData;
        this.#fingerprints = fingerprints;
        this.#contentsByBannerId = contentsByBannerId;
        this.#innerRootElement = innerRootElement;

        this.#redraw(false);
        this.setState(state.value, state.info);
    }

    /**
     * @returns {Array<Fingerprint>}
     */
    get fingerprints() {
        return this.#fingerprints;
    }

    unsetFingerprint(fingerprint) {
        this.#fingerprints = this.#fingerprints.filter(f => f.value !== fingerprint.value);

        const bannerId = fingerprint.bannerId;

        if (bannerId in this.#contentsByBannerId) {
            delete this.#contentsByBannerId[bannerId];
        }

        if (0 >= this.#fingerprints.length) {
            this.setState(this.STATE.CLOSED, 'Banner has empty data.');
        }
    }

    /**
     * @returns {number|null}
     */
    getCurrentBreakpoint(bannerId) {
        const contents = this.#contentsByBannerId[bannerId] || null;

        if (null === contents) {
            return null;
        }

        return contents.content?.breakpoint || null;
    }

    isExternal() {
        return true;
    }

    delegateResponsiveBehaviour() {

    }

    redrawIfNeeded() {
        if (this.#redraw(true)) {
            this.setState(this.STATE.RENDERED, 'Banner was successfully redrawn.');
        }
    }

    #redraw(ifNeeded) {
        let redraw = !ifNeeded;

        if (!redraw) {
            for (let bannerId in this.#contentsByBannerId) {
                const contents = this.#contentsByBannerId[bannerId];

                if (contents.needRedraw()) {
                    redraw = true;
                    break;
                }
            }
        }

        if (!redraw) {
            return false;
        }

        const banners = [];

        for (let bannerId in this.#contentsByBannerId) {
            const content = this.#contentsByBannerId[bannerId].content;

            if (null !== content) {
                banners.push(content.data.html);
            }
        }

        if (0 >= banners.length) {
            this.element.innerHTML = '';

            return true;
        }

        const rootEl = this.#innerRootElement ? this.#innerRootElement.cloneNode(true) : null;
        let listEl = null !== rootEl && undefined === rootEl.dataset.ampBannerList ? rootEl.querySelector('[data-amp-banner-list]') : null;

        (listEl ?? rootEl ?? this.element).innerHTML = banners.join("\n");

        if (null !== rootEl) {
            this.element.innerHTML = rootEl.outerHTML;
        }

        return true;
    }
}
