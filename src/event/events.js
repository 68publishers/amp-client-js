class Events {
    /**
     * Arguments: {Banner}
     */
    static get ON_BANNER_ATTACHED() {
        return 'amp:banner:attached';
    }

    /**
     * Arguments: ({Banner} banner)
     */
    static get ON_BANNER_STATE_CHANGED() {
        return 'amp:banner:state-changed';
    }

    /**
     * Arguments: (
     *     {
     *         fingerprint: {Fingerprint},
     *         element: {HtmlElement},
     *         banner: {Banner},
     *         entry: {IntersectionObserverEntry},
     *     },
     * )
     */
    static get ON_BANNER_INTERSECTION_CHANGED() {
        return 'amp:banner:intersection-changed';
    }

    /**
     * Arguments: (
     *     {
     *         fingerprint: {Fingerprint},
     *         element: {HtmlElement},
     *         banner: {Banner},
     *     },
     * )
     */
    static get ON_BANNER_FIRST_TIME_SEEN() {
        return 'amp:banner:first-time-seen';
    }

    /**
     * Arguments: (
     *     {
     *         fingerprint: {Fingerprint},
     *         element: {HtmlElement},
     *         banner: {Banner},
     *     },
     * )
     */
    static get ON_BANNER_FIRST_TIME_FULLY_SEEN() {
        return 'amp:banner:first-time-fully-seen';
    }

    /**
     * Arguments: (
     *     {
     *         fingerprint: {Fingerprint},
     *         element: {HtmlElement},
     *         banner: {Banner},
     *         target: {HtmlElement},
     *         clickEvent: {Event},
     *     },
     * )
     */
    static get ON_BANNER_LINK_CLICKED() {
        return 'amp:banner:link-clicked';
    }

    /**
     * No arguments
     */
    static get ON_BEFORE_FETCH() {
        return 'amp:fetch:before';
    }

    /**
     * Arguments: ({Object} response)
     */
    static get ON_FETCH_ERROR() {
        return 'amp:fetch:error';
    }

    /**
     * Arguments: ({Object} response)
     */
    static get ON_FETCH_SUCCESS() {
        return 'amp:fetch:success';
    }
}

module.exports = Events;
