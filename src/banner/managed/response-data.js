/**
 * @deprecated
 */
class ResponseData {
    constructor(managedBanner) {
        this.managedBanner = managedBanner;
    }

    get positionCode() {
        return this.managedBanner.positionData.code;
    }

    get rotationSeconds() {
        return this.managedBanner.positionData.rotationSeconds;
    }

    get displayType() {
        return this.managedBanner.positionData.displayType;
    }

    get breakpointType() {
        return this.managedBanner.positionData.breakpointType;
    }

    get fingerprints() {
        return this.managedBanner.fingerprints;
    }

    get bannerData() {
        return this.managedBanner.bannerData;
    }
}

module.exports = ResponseData;
