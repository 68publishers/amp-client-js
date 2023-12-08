import { Fingerprint } from '../fingerprint.mjs';

export class BannerData {
    #data;
    #breakpointType;
    #fingerprint = null;
    #resolvedContent = null;
    #resolvedContentBounds = {
        min: null,
        max: null,
        reset: function () {
            this.min = this.max = null;
        },
    };

    constructor(data, breakpointType) {
        this.#data = data;
        this.#breakpointType = breakpointType;
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
        if (null !== this.#resolvedContent && !this.needRedraw()) {
            return this.#resolvedContent;
        }

        this.#resolvedContentBounds.reset();

        const windowWith = this.#getWidth();
        const contents = this.#data.contents;
        const breakpointType = this.#breakpointType;

        let defaultContent = null,
            alternativeContent = null,
            currentBreakpoint = null;

        const breakpoints = [];

        this.#iterate(contents, (content) => {
            let breakpoint = content['breakpoint'];

            if (null === breakpoint) {
                defaultContent = content;

                return;
            }

            breakpoints.push(breakpoint);

            if (('min' === breakpointType && windowWith >= breakpoint && (null === currentBreakpoint || currentBreakpoint < breakpoint))
                || ('max' === breakpointType && windowWith <= breakpoint && (null === currentBreakpoint || currentBreakpoint > breakpoint))) {
                alternativeContent = content;
                currentBreakpoint = breakpoint;
                this.#resolvedContentBounds[breakpointType] = breakpoint;
            }
        });

        if (null === alternativeContent && null === defaultContent) {
            throw new Error(`Missing content for banner with ID ${this.id}`);
        }

        // find bounds
        breakpoints.sort((a, b) => a - b);

        if ('min' === breakpointType) {
            breakpoints.unshift(null);
        } else {
            breakpoints.push(null);
        }

        const currentBreakpointIndex = breakpoints.indexOf(currentBreakpoint);

        if ('max' === breakpointType && (currentBreakpointIndex - 1) in breakpoints) {
            this.#resolvedContentBounds.min = breakpoints[currentBreakpointIndex - 1];
        }

        if ('min' === breakpointType && (currentBreakpointIndex + 1) in breakpoints) {
            this.#resolvedContentBounds.max = breakpoints[currentBreakpointIndex + 1];
        }

        return this.#resolvedContent = null !== alternativeContent ? alternativeContent : defaultContent;
    }

    needRedraw() {
        if (null === this.#resolvedContent) {
            return true;
        }

        const windowWith = this.#getWidth();

        return ((null !== this.#resolvedContentBounds.min && windowWith < this.#resolvedContentBounds.min)
            || (null !== this.#resolvedContentBounds.max && windowWith > this.#resolvedContentBounds.max));
    }

    #getWidth() {
        return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    }

    #iterate(data, cb) {
        for (let i in data) {
            cb(data[i], i);
        }
    }
}
