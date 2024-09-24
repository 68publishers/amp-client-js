import { Banner } from '../banner.mjs';
import { PositionData } from '../position-data.mjs';
import { BannerData } from './banner-data.mjs';
import { ResponseData } from './response-data.mjs';
import { Randomizer } from '../../utils/randomizer.mjs';
import { Fingerprint } from '../fingerprint.mjs';
import { Resource } from '../../request/resource.mjs';

export class ManagedBanner extends Banner {
    #dimensionsProvider;
    #renderer;
    #resources = [];
    #rawResources;
    #responseDataReceived = false;
    #resolvedBannerData = null;
    #banners = [];

    /**
     * @param {DimensionsProvider} dimensionsProvider
     * @param {BannerRenderer} renderer
     * @param {EventBus} eventBus
     * @param {String} uid
     * @param {HTMLElement} element
     * @param {String} position
     * @param {Object} resources
     * @param {Object} options
     */
    constructor(
        dimensionsProvider,
        renderer,
        eventBus,
        uid,
        element,
        position,
        resources = {},
        options = {},
    ) {
        super(eventBus, uid, element, position, options);

        this.#dimensionsProvider = dimensionsProvider;
        this.#renderer = renderer;
        this.#rawResources = resources;

        for (let key in resources) {
            this.#resources.push(new Resource(key, resources[key]));
        }

        this.setState(this.STATE.NEW, 'Banner created.');
    }

    set html(html) {
        this.element.innerHTML = html;
    }

    /**
     * @returns {Array<Resource>}
     */
    get resources () {
        return this.#resources;
    }

    /**
     * @returns {Object}
     */
    get rawResources() {
        return this.#rawResources;
    }

    /**
     * @deprecated Use property `positionData` for accessing information about a position
     */
    get data() {
        console.warn('Usage of deprecated property `ManagedBanner.data`. Please use property `positionData` for accessing information about a position.');

        return new ResponseData(this);
    }

    /**
     * @returns {Array<Fingerprint>}
     */
    get fingerprints() {
        let bannerData;

        try {
            bannerData = this.bannerData;
        } catch (e) {
            return [];
        }

        if (null === bannerData) {
            return [];
        }

        if (!this.positionData.isMultiple()) {
            bannerData = [bannerData];
        }

        return bannerData.map(r => r.fingerprint);
    }

    /**
     * @returns {BannerData|Array<BannerData>}
     */
    get bannerData() {
        if (null !== this.#resolvedBannerData) {
            return this.#resolvedBannerData;
        }

        if (!this.#banners.length) {
            return null;
        }

        let data = null;
        const positionData = this.positionData;

        const createFingerprint = bannerData => Fingerprint.createFromProperties({
            bannerId: bannerData.id,
            bannerName: bannerData.name,
            positionId: positionData.id,
            positionCode: positionData.code,
            positionName: positionData.name,
            campaignId: bannerData.campaignId,
            campaignCode: bannerData.campaignCode,
            campaignName: bannerData.campaignName,
        });

        switch (true) {
            case positionData.isSingle():
                data = this.#banners.reduce((a, b) => a.score >= b.score ? a : b)
                data.fingerprint = createFingerprint(data);
                break;
            case positionData.isRandom():
                data = Randomizer.randomByWeights(this.#banners, 'score');
                data.fingerprint = createFingerprint(data);
                break;
            case positionData.isMultiple():
                data = this.#banners.sort((a, b) => b.score - a.score);

                for (let row of data) {
                    row.fingerprint = createFingerprint(row);
                }

                break;
            default:
                throw new Error(`Invalid display type ${this.displayType}.`);
        }

        this.#resolvedBannerData = data;

        return data;
    }

    unsetFingerprint(fingerprint) {
        const bannerId = fingerprint.bannerId;
        const positionData = this.positionData;
        const bannerFound = !!this.#banners.filter(bannerData => bannerData.id === bannerId)[0];

        if (!bannerFound) {
            return;
        }

        switch (true) {
            case positionData.isSingle():
                this.#banners = [];
                this.#resolvedBannerData = null;
                break;
            case positionData.isRandom():
                if (this.#resolvedBannerData && this.#resolvedBannerData.id === bannerId) {
                    this.#banners = [];
                    this.#resolvedBannerData = null;
                } else {
                    this.#banners = this.#banners.filter(bannerData => bannerData.id !== bannerId);
                }
                break;
            case positionData.isMultiple():
                this.#banners = this.#banners.filter(bannerData => bannerData.id !== bannerId);
                this.#resolvedBannerData && (this.#resolvedBannerData = this.#resolvedBannerData.filter(bannerData => bannerData.id !== bannerId));
                break;
        }

        if (0 >= this.#banners.length) {
            this.setState(this.STATE.CLOSED, 'Banner has empty data.');
        } else if (positionData.isRandom()) {
            this.redrawIfNeeded();
        }
    }

    setResponseData(responseData) {
        if (this.#responseDataReceived) {
            throw new Error(`Data for banner on position ${this.position} is already set.`);
        }

        this._positionData = new PositionData({
            id: responseData['position_id'] || null,
            code: this._positionData.code,
            name: responseData['position_name'] || null,
            rotationSeconds: responseData['rotation_seconds'],
            displayType: responseData['display_type'],
            breakpointType: responseData['breakpoint_type'],
            dimensions: responseData['dimensions'] || { width: null, height: null },
        });

        if ('options' in responseData) {
            this.overrideOptions(responseData.options);
        }

        const banners = [];

        for (let i in (responseData.banners || [])) {
            banners.push(new BannerData(
                responseData.banners[i],
                responseData['breakpoint_type'],
                this.#dimensionsProvider,
            ));
        }

        this.#banners = banners;
        this.#responseDataReceived = true;

        if (0 >= this.#banners.length) {
            this.setState(this.STATE.CLOSED, 'Banner has empty data.');
        } else {
            this.#render('Banner was successfully rendered.');
        }
    }

    getCurrentBreakpoint(bannerId) {
        let bannerData = this.bannerData;
        bannerData = (Array.isArray(bannerData) ? bannerData : (bannerData ? [bannerData] : [])).find(banner => banner.id === bannerId);

        const breakpoint = bannerData && bannerData.content ? bannerData.content.breakpoint : null;

        return null === breakpoint ? null : parseInt(breakpoint);
    }

    isManaged() {
        return true;
    }

    redrawIfNeeded() {
        if (this.#needRedraw()) {
            this.#render('Banner was successfully redrawn.');
        }
    }

    #render(stateInfo) {
        try {
            this.html = this.#renderer.render(this);
        } catch (e) {
            this.setState(this.STATE.ERROR, 'Render error: ' + e.message);

            return;
        }

        this.setState(this.STATE.RENDERED, stateInfo);
    }

    #needRedraw() {
        let data = this.bannerData;

        if (!Array.isArray(data)) {
            data = [data];
        }

        for (let i in data) {
            if (data[i].needRedraw()) {
                return true;
            }
        }

        return false;
    }
}
