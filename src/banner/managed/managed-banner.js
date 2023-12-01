const Banner = require('../banner');
const PositionData = require('../position-data');
const BannerData = require('./banner-data');
const ResponseData = require('./response-data');
const Randomizer = require('../../utils/randomizer');
const Fingerprint = require('../fingerprint');
const internal = require('../../utils/internal-state');

class ManagedBanner extends Banner {
    constructor(eventBus, element, position, resources = [], options = {}) {
        super(eventBus, element, position, options);

        internal(this).resources = resources;
        internal(this).responseDataReceived = false;
        internal(this).resolvedBannerData = null;
        internal(this).banners = [];
    }

    set html(html) {
        internal(this).element.innerHTML = html;
    }

    get resources () {
        return internal(this).resources;
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
        if (null !== internal(this).resolvedBannerData) {
            return internal(this).resolvedBannerData;
        }

        if (!internal(this).banners.length) {
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
                data = internal(this).banners.reduce((a, b) => a.score >= b.score ? a : b)
                data.fingerprint = createFingerprint(data);
                break;
            case positionData.isRandom():
                data = Randomizer.randomByWeights(internal(this).banners, 'score');
                data.fingerprint = createFingerprint(data);
                break;
            case positionData.isMultiple():
                data = internal(this).banners.sort((a, b) => b.score - a.score);

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

        internal(this).resolvedBannerData = data;

        return data;
    }

    getCurrenBreakpoint(bannerId) {
        let bannerData = this.bannerData;
        bannerData = (Array.isArray(bannerData) ? bannerData : [bannerData]).find(banner => banner.id === bannerId);

        const breakpoint = bannerData && bannerData.content ? bannerData.content.breakpoint : null;

        return null === breakpoint ? null : parseInt(breakpoint);
    }

    setResponseData(responseData) {
        if (internal(this).responseDataReceived) {
            throw new Error(`Data for banner on position ${this.position} is already set.`);
        }

        internal(this).positionData = new PositionData({
            id: responseData['position_id'] || null,
            code: this.positionData.code,
            name: responseData['position_name'] || null,
            rotationSeconds: responseData['rotation_seconds'],
            displayType: responseData['display_type'],
            breakpointType: responseData['breakpoint_type'],
        });

        const banners = [];

        for (let i in (responseData.banners || [])) {
            banners.push(new BannerData(responseData.banners[i], responseData['breakpoint_type']));
        }

        internal(this).banners = banners;
        internal(this).responseDataReceived = true;
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

module.exports = ManagedBanner;
