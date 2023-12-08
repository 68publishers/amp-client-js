import { Banner } from '../banner.mjs';
import { PositionData } from '../position-data.mjs';
import { BannerData } from './banner-data.mjs';
import { ResponseData } from './response-data.mjs';
import { Randomizer } from '../../utils/randomizer.mjs';
import { Fingerprint } from '../fingerprint.mjs';

export class ManagedBanner extends Banner {
    #resources;
    #responseDataReceived = false;
    #resolvedBannerData = null;
    #banners = [];

    constructor(eventBus, uid, element, position, resources = [], options = {}) {
        super(eventBus, uid, element, position, options);

        this.#resources = resources;
    }

    set html(html) {
        this.element.innerHTML = html;
    }

    get resources () {
        return this.#resources;
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
            throw new Error('Banner\'s data is empty.');
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

        if (null === data) {
            throw new Error('Banner\'s data is empty.');
        }

        this.#resolvedBannerData = data;

        return data;
    }

    getCurrenBreakpoint(bannerId) {
        let bannerData = this.bannerData;
        bannerData = (Array.isArray(bannerData) ? bannerData : [bannerData]).find(banner => banner.id === bannerId);

        const breakpoint = bannerData && bannerData.content ? bannerData.content.breakpoint : null;

        return null === breakpoint ? null : parseInt(breakpoint);
    }

    isManaged() {
        return true;
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
        });

        const banners = [];

        for (let i in (responseData.banners || [])) {
            banners.push(new BannerData(responseData.banners[i], responseData['breakpoint_type']));
        }

        this.#banners = banners;
        this.#responseDataReceived = true;
    }

    needRedraw() {
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
