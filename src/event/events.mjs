export class Events {
    /**
     * Arguments: (
     *     {
     *         banner: {Banner},
     *     },
     * )
     */
    static get ON_BANNER_ATTACHED() {
        return 'amp:banner:attached';
    }

    /**
     * Arguments: (
     *     {
     *         banner: {Banner},
     *     },
     * )
     */
    static get ON_BANNER_STATE_CHANGED() {
        return 'amp:banner:state-changed';
    }

    /**
     * Not dispatched for embed banners in the main frame.
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
     * Not dispatched for embed banners in the main frame.
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
     * Not dispatched for embed banners in the main frame.
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
     * Not dispatched for embed banners in the main frame.
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
     * Not dispatched for embed banners in the main frame.
     * Arguments: (
     *     {
     *         fingerprint: {Fingerprint},
     *         element: {HtmlElement},
     *         banner: {Banner},
     *         setOperation: {Function()}
     *     },
     * )
     */
    static get ON_BANNER_BEFORE_CLOSE() {
        return 'amp:banner:before-close';
    }

    /**
     * Not dispatched for embed banners in the main frame.
     * Arguments: (
     *     {
     *         fingerprint: {Fingerprint},
     *         element: {HtmlElement},
     *         banner: {Banner},
     *     },
     * )
     */
    static get ON_BANNER_AFTER_CLOSE() {
        return 'amp:banner:after-close';
    }

    /**
     * No arguments
     */
    static get ON_BEFORE_FETCH() {
        return 'amp:fetch:before';
    }

    /**
     * Arguments: (
     *     {
     *         response: {Object},
     *     },
     * )
     */
    static get ON_FETCH_ERROR() {
        return 'amp:fetch:error';
    }

    /**
     * Arguments: (
     *     {
     *         response: {Object},
     *     },
     * )
     */
    static get ON_FETCH_SUCCESS() {
        return 'amp:fetch:success';
    }
}
