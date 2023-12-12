import { Fingerprint } from '../fingerprint.mjs';
import { Contents } from '../responsive/contents.mjs';

export class BannerData {
    #data;
    #contents;
    #fingerprint = null;

    constructor(data, breakpointType, dimensionsProvider) {
        this.#data = data;
        this.#contents = new Contents(dimensionsProvider, breakpointType);

        for (let content of this.#data.contents) {
            this.#contents.addContent(content['breakpoint'], content);
        }
    }

    set fingerprint(fingerprint) {
        if (!(fingerprint instanceof Fingerprint)) {
            throw new TypeError(`The value must be instance of Fingerprint object.`);
        }

        this.#fingerprint = fingerprint;
    }

    get fingerprint() {
        return this.#fingerprint;
    }

    get id() {
        return this.#data.id;
    }

    get name() {
        return this.#data.name || null;
    }

    get score() {
        return this.#data.score;
    }

    /**
     * @deprecated Use property `campaignCode` instead
     */
    get campaign() {
        console.warn('Usage of deprecated property `BannerData.campaign`. Please use property `campaignCode` instead.');

        return this.campaignCode();
    }

    get campaignId() {
        return this.#data.campaign_id || null;
    }

    get campaignCode() {
        return this.#data.campaign_code || this.#data.campaign || null;
    }

    get campaignName() {
        return this.#data.campaign_name || null;
    }

    get content() {
        return this.#contents.content.data;
    }

    needRedraw() {
        return this.#contents.needRedraw();
    }
}
