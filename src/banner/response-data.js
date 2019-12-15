'use strict';

(function (_, internal, BannerData, Randomizer) {

    class ResponseData {

        constructor(response) {
            internal(this).positionInfo = {
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

        get rotationSeconds() {
            return internal(this).positionInfo.rotationSeconds;
        }

        get displayType() {
            return internal(this).positionInfo.displayType;
        }

        get breakpointType() {
            return internal(this).positionInfo.breakpointType;
        }

        get bannerData() {
            if (null !== internal(this).resolvedBannerData) {
                return internal(this).resolvedBannerData;
            }

            let data = null;

            switch (this.displayType) {
                case 'single':
                    data = _.maxBy(internal(this).banners, 'score');
                    break;
                case 'random':
                    data = Randomizer.randomByWeights(internal(this).banners, 'score');
                    break;
                case 'multiple':
                    data = _.orderBy(internal(this).banners, ['score'], ['desc']);
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

})(require('lodash'), require('../utils/internal-state')(), require('./banner-data'), require('../utils/randomizer'));
