'use strict';

(function (State, Events, ResponseData, internal) {

    class Banner {

        constructor(eventBus, element, position, resources = []) {
            // constants
            this.STATE = State;

            internal(this).eventBus = eventBus;
            internal(this).element = element;
            internal(this).position = position;
            internal(this).resources = resources;
            internal(this).responseData = undefined;

            this.setState(this.STATE.NEW, 'Banner created.');
        }

        get element() {
            return internal(this).element;
        }

        set html(html) {
            internal(this).element.innerHTML = html;
        }

        get state() {
            return internal(this).state;
        }

        get stateInfo() {
            return internal(this).stateInfo;
        }

        get position () {
            return internal(this).position;
        }

        get data() {
            return internal(this).responseData;
        }

        setResponseData(responseData) {
            if (undefined !== internal(this).responseData) {
                throw new Error(`Data for banner on position ${this.position} is already set.`);
            }

            internal(this).responseData = new ResponseData(responseData);
        }

        setState(state, info = '') {
            if (!this.STATE.STATES.includes(state)) {
                throw new TypeError(`${state} is not valid state.`);
            }

            internal(this).state = state;
            internal(this).stateInfo = info.toString();

            internal(this).eventBus.dispatch(Events.ON_BANNER_STATE_CHANGED, this);
        }

        needRedraw() {
            let data = this.data.bannerData;

            if ('[object Array]' !== Object.prototype.toString.call(data)) {
                data = [ data ];
            }

            for (let i in data) {
                if (!data.hasOwnProperty(i)) {
                    continue;
                }

                if (data[i].needRedraw()) {
                    return true;
                }
            }

            return false;
        }
    }

    module.exports = Banner;

})(require('./state'), require('../event/events'), require('./response-data'), require('../utils/internal-state')());
