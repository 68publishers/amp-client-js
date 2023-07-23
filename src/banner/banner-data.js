const internal = require('../utils/internal-state')();
const Fingerprint = require('./fingerprint');

const getWidth = () => {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
};

const iterate = (data, cb) => {
    for (let i in data) {
        cb(data[i], i);
    }
};

class BannerData {
    constructor(data, breakpointType) {
        internal(this).data = data;
        internal(this).fingerprint = null;
        internal(this).breakpointType = breakpointType;
        internal(this).resolvedContent = null;
        internal(this).resolvedContentBounds = {
            min: null,
            max: null,
            reset: function () {
                this.min = this.max = null;
            },
        };
    }

    set fingerprint(fingerprint) {
        if (!(fingerprint instanceof Fingerprint)) {
            throw new TypeError(`The value must be instance of Fingerprint object.`);
        }

        internal(this).fingerprint = fingerprint;
    }

    get fingerprint() {
        return internal(this).fingerprint;
    }

    get id() {
        return internal(this).data.id;
    }

    get name() {
        return internal(this).data.name || null;
    }

    get score() {
        return internal(this).data.score;
    }

    /**
     * @deprecated use `.campaignCode` instead
     */
    get campaign() {
        return this.campaignCode();
    }

    get campaignId() {
        return internal(this).data.campaign_id || null;
    }

    get campaignCode() {
        return internal(this).data.campaign_code || internal(this).data.campaign || null;
    }

    get campaignName() {
        return internal(this).data.campaign_name || null;
    }

    get content() {
        const privateProperties = internal(this);

        if (null !== privateProperties.resolvedContent && !this.needRedraw()) {
            return privateProperties.resolvedContent;
        }

        privateProperties.resolvedContentBounds.reset();

        const windowWith = getWidth();
        const contents = privateProperties.data.contents;
        const breakpointType = privateProperties.breakpointType;

        let defaultContent = null,
            alternativeContent = null,
            currentBreakpoint = null;

        const breakpoints = [];

        iterate(contents, (content) => {
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
                privateProperties.resolvedContentBounds[breakpointType] = breakpoint;
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
            privateProperties.resolvedContentBounds.min = breakpoints[currentBreakpointIndex - 1];
        }

        if ('min' === breakpointType && (currentBreakpointIndex + 1) in breakpoints) {
            privateProperties.resolvedContentBounds.max = breakpoints[currentBreakpointIndex + 1];
        }

        return privateProperties.resolvedContent = null !== alternativeContent ? alternativeContent : defaultContent;
    }

    needRedraw() {
        const privateProperties = internal(this);

        if (null === privateProperties.resolvedContent) {
            return true;
        }

        const windowWith = getWidth();

        return ((null !== privateProperties.resolvedContentBounds.min && windowWith < privateProperties.resolvedContentBounds.min)
            || (null !== privateProperties.resolvedContentBounds.max && windowWith > privateProperties.resolvedContentBounds.max));
    }
}

module.exports = BannerData;
