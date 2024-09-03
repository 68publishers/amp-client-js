import { Banner } from '../banner.mjs';
import { Fingerprint } from '../fingerprint.mjs';

export class EmbedBanner extends Banner {
    #iframe;
    #fingerprints;

    constructor(eventBus, uid, element, iframe, position, options) {
        super(eventBus, uid, element, position, options);

        this.#iframe = iframe;
        this.#fingerprints = [];

        this.setState(this.STATE.NEW, 'Banner created.');
    }

    get iframe() {
        return this.#iframe;
    }

    get fingerprints() {
        return this.#fingerprints;
    }

    unsetFingerprint(fingerprint) {
        this.#fingerprints = this.#fingerprints.filter(f => f.value !== fingerprint.value);

        if (0 >= this.#fingerprints.length) {
            this.setState(this.STATE.CLOSED, 'Banner has empty data.');
        }
    }

    getCurrenBreakpoint(bannerId) {  // eslint-disable-line no-unused-vars
        throw new Error('Method EmbedBanner.getCurrenBreakpoint() is not readable.');
    }

    isEmbed() {
        return true;
    }

    updatePositionData(data) {
        const props = ['id', 'name', 'rotationSeconds', 'displayType', 'breakpointType', 'dimensions'];
        const positionData = this.positionData;

        for (let prop of props) {
            if (prop in data) {
                positionData[prop] = data[prop];
            }
        }
    }

    updateFingerprints(fingerprints) {
        this.#fingerprints = fingerprints.map(f => f instanceof Fingerprint ? f : Fingerprint.createFromValue(f));
    }
}
