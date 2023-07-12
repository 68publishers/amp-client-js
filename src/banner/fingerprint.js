const internal = require('../utils/internal-state')();

class Fingerprint {
    constructor(value, bannerId, positionCode, campaignCode) {
        internal(this).value = value;
        internal(this).bannerId = bannerId;
        internal(this).positionCode = positionCode;
        internal(this).campaignCode = campaignCode;
    }

    static createFromProperties(bannerId, positionCode, campaignCode) {
        return new Fingerprint(
            btoa(JSON.stringify({ bannerId, positionCode, campaignCode })),
            bannerId,
            positionCode,
            campaignCode,
        );
    }

    static createFromValue(value) {
        const properties = JSON.parse(atob(value));

        if (!('bannerId' in properties) || !('positionCode' in properties)) {
            throw new Error(`Malformed banner fingerprint "${value}".`);
        }

        return new Fingerprint(
            value,
            properties.bannerId,
            properties.positionCode,
            properties.campaignCode || null,
        );
    }

    get value() {
        return internal(this).value;
    }

    get bannerId() {
        return internal(this).bannerId;
    }

    get positionCode() {
        return internal(this).positionCode;
    }

    get campaignCode() {
        return internal(this).campaignCode;
    }

    toString() {
        return this.value;
    }
}

module.exports = Fingerprint;
