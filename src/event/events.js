'use strict';

(function () {

    class Events {

        /**
         * Arguments: {Banner}
         */
        static get ON_BANNER_ATTACHED() {
            return 'amp:banner:attached';
        };

        /**
         * Arguments: ({Banner} banner)
         */
        static get ON_BANNER_STATE_CHANGED() {
            return 'amp:banner:state-changed';
        }

        /**
         * No arguments
         */
        static get ON_BEFORE_FETCH() {
            return 'amp:fetch:before';
        };

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

})();
