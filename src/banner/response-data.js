const internal = require('../utils/internal-state')();
const BannerData = require('./banner-data');
const Randomizer = require('../utils/randomizer');
const Fingerprint = require('./fingerprint');

class ResponseData {
    constructor(positionCode, response) {
        internal(this).positionInfo = {
            id: response['position_id'] || null,
            code: positionCode,
            name: response['position_name'] || null,
            rotationSeconds: response['rotation_seconds'],
            displayType: response['display_type'],
            breakpointType: response['breakpoint_type'],
        };
        internal(this).resolvedBannerData = null;

        const banners = [];

        for (let i in response.banners) {
            banners.push(new BannerData(response.banners[i], this.breakpointType));
        }

        internal(this).banners = banners;
    }

    get positionCode() {
        return internal(this).positionInfo.code;
    }

    get rotationSeconds() {
        return internal(this).positionInfo.rotationSeconds;
    }

    get displayType() {
        return internal(this).positionInfo.displayType;
    }

    get breakpointType() {
        return internal(this).positionInfo.breakpointType;
    }

    get fingerprints() {
        let bannerData = this.bannerData;

        if ('multiple' !== this.displayType) {
            bannerData = [bannerData];
        }

        return bannerData.map(r => r.fingerprint);
    }

    get bannerData() {
        if (null !== internal(this).resolvedBannerData) {
            return internal(this).resolvedBannerData;
        }

        if (!internal(this).banners.length) {
            throw new Error('Banner\'s data is empty.');
        }

        let data = null;
        const positionInfo = internal(this).positionInfo;
        const positionId = positionInfo.id;
        const positionCode = positionInfo.code;
        const positionName = positionInfo.name;

        const createFingerprint = bannerData => Fingerprint.createFromProperties({
            bannerId: bannerData.id,
            bannerName: bannerData.name,
            positionId,
            positionCode,
            positionName,
            campaignId: bannerData.campaignId,
            campaignCode: bannerData.campaignCode,
            campaignName: bannerData.campaignName,
        });

        switch (this.displayType) {
            case 'single':
                data = internal(this).banners.reduce((a, b) => a.score >= b.score ? a : b)
                data.fingerprint = createFingerprint(data);
                break;
            case 'random':
                data = Randomizer.randomByWeights(internal(this).banners, 'score');
                data.fingerprint = createFingerprint(data);
                break;
            case 'multiple':
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
}

module.exports = ResponseData;
