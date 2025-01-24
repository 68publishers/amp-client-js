import { Content } from './content.mjs';

export class Contents {
    #dimensionsProvider;
    #breakpointType;
    #contents = [];
    #resolvedContent = undefined;
    #resolvedContentBounds = {
        min: null,
        max: null,
        reset: function () {
            this.min = this.max = null;
        },
    };

    /**
     * @param {DimensionsProvider} dimensionsProvider
     * @param {String|null} breakpointType
     */
    constructor(dimensionsProvider, breakpointType) {
        this.#dimensionsProvider = dimensionsProvider;
        this.#breakpointType = breakpointType;
    }

    addContent(breakpoint, data) {
        this.#contents.push(new Content(breakpoint, data));
        this.#resolvedContent = undefined;
    }

    get contents() {
        return this.#contents;
    }

    get content() {
        if (undefined !== this.#resolvedContent && !this.needRedraw()) {
            return this.#resolvedContent;
        }

        this.#resolvedContentBounds.reset();

        const windowWith = this.#dimensionsProvider.width;
        const breakpointType = this.#breakpointType;

        let defaultContent = null,
            alternativeContent = null,
            currentBreakpoint = null;

        const breakpoints = [];

        this.#iterate(this.#contents, content => {
            let breakpoint = content.breakpoint;

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
        if (undefined === this.#resolvedContent) {
            return true;
        }

        const windowWith = this.#dimensionsProvider.width;

        return ((null !== this.#resolvedContentBounds.min && windowWith < this.#resolvedContentBounds.min)
            || (null !== this.#resolvedContentBounds.max && windowWith > this.#resolvedContentBounds.max));
    }

    #iterate(data, cb) {
        for (let i in data) {
            cb(data[i], i);
        }
    }
}
