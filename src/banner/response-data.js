'use strict';

const _ = require('lodash');
const internal = require('../utils/internal-state')();
const BannerData = require('./banner-data');
const Randomizer = require('../utils/randomizer');
const Fingerprint = require('./fingerprint');

class ResponseData {
    constructor(positionCode, response) {
        internal(this).positionInfo = {
            code: positionCode,
            rotationSeconds: response['rotation_seconds'],
            displayType: response['display_type'],
            breakpointType: response['breakpoint_type'],
        };
        internal(this).resolvedBannerData = null;

        const banners = [];

        for (let i in response.banners) {
            if (!response.banners.hasOwnProperty(i)) {
                continue;
            }

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

        let data = null;
        const positionCode = this.positionCode;

        switch (this.displayType) {
            case 'single':
                data = _.maxBy(internal(this).banners, 'score');
                data.fingerprint = Fingerprint.createFromProperties(data.id, positionCode, data.campaign);
                break;
            case 'random':
                data = Randomizer.randomByWeights(internal(this).banners, 'score');
                data.fingerprint = Fingerprint.createFromProperties(data.id, positionCode, data.campaign);
                break;
            case 'multiple':
                data = _.orderBy(internal(this).banners, ['score'], ['desc']);

                for (let row of data) {
                    row.fingerprint = Fingerprint.createFromProperties(row.id, positionCode, row.campaign);
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
