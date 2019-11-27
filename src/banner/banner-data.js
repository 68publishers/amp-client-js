'use strict';

(function (window, document, internal) {

    const getWidth = () => {
        return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    };

    class BannerData {

        constructor(data, breakpointType) {
            internal(this).data = data;
            internal(this).breakpointType = breakpointType;
            internal(this).resolvedContent = null;
        }

        get id() {
            return internal(this).data.id;
        }

        get score() {
            return internal(this).data.score;
        }

        get campaign() {
            return internal(this).data.campaign;
        }

        get content() {
            const privateProperties = internal(this);

            if (null !== privateProperties.resolvedContent) {
                return privateProperties.resolvedContent;
            }

            const windowWith = getWidth();
            const contents = privateProperties.data.contents;
            const breakpointType = privateProperties.breakpointType;

            let defaultContent = null,
                alternativeContent = null,
                currentBreakpoint = null;

            for (let i in contents) {
                if (!contents.hasOwnProperty(i)) {
                    continue;
                }

                let breakpoint = contents[i]['breakpoint'];

                if (null === breakpoint) {
                    defaultContent = contents[i];

                    continue;
                }

                if (('min' === breakpointType && windowWith >= breakpoint && (null === currentBreakpoint || currentBreakpoint < breakpoint))
                    || ('max' === breakpointType && windowWith <= breakpoint && (null === currentBreakpoint || currentBreakpoint > breakpoint))) {
                    alternativeContent = contents[i];
                    currentBreakpoint = breakpoint;
                }
            }

            if (null === alternativeContent && null === defaultContent) {
                throw new Error(`Missing content for banner with ID ${this.id}`);
            }

            return privateProperties.resolvedContent = null !== alternativeContent ? alternativeContent : defaultContent;
        }
    }

    module.exports = BannerData;

})(window, document, require('../utils/internal-state')());
