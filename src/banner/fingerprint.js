class Fingerprint {
    constructor(value, { bannerId, bannerName, positionId, positionCode, positionName, campaignId, campaignCode, campaignName }) {
        this.value = value;
        this.bannerId = bannerId;
        this.bannerName = bannerName;
        this.positionId = positionId;
        this.positionCode = positionCode;
        this.positionName = positionName;
        this.campaignId = campaignId;
        this.campaignCode = campaignCode;
        this.campaignName = campaignName;
    }

    static createFromProperties(properties) {
        return new Fingerprint(
            btoa(JSON.stringify(properties)),
            properties,
        );
    }

    static createFromValue(value) {
        return new Fingerprint(
            value,
            JSON.parse(atob(value)),
        );
    }

    toString() {
        return this.value;
    }
}

module.exports = Fingerprint;
