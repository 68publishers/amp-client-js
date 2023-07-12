const State = require('./state');
const Events = require('../event/events');
const ResponseData = require('./response-data');
const internal = require('../utils/internal-state')();

class Banner {
    constructor(eventBus, element, position, resources = []) {
        // constants
        this.STATE = State;

        internal(this).eventBus = eventBus;
        internal(this).element = element;
        internal(this).position = position;
        internal(this).resources = resources;
        internal(this).responseData = undefined;
        internal(this).htmlChangedCounter = 0;

        this.setState(this.STATE.NEW, 'Banner created.');
    }

    get element() {
        return internal(this).element;
    }

    set html(html) {
        internal(this).element.innerHTML = html;
        internal(this).htmlChangedCounter++;
    }

    get htmlChangedCounter() {
        return internal(this).htmlChangedCounter;
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

    get resources () {
        return internal(this).resources;
    }

    get data() {
        return internal(this).responseData;
    }

    get fingerprints() {
        const bannerData = this.data;

        return (!(bannerData instanceof ResponseData)) ? [] : bannerData.fingerprints;
    }

    setResponseData(responseData) {
        if (undefined !== internal(this).responseData) {
            throw new Error(`Data for banner on position ${this.position} is already set.`);
        }

        internal(this).responseData = new ResponseData(this.position, responseData);
    }

    setState(state, info = '') {
        if (-1 === this.STATE.STATES.indexOf(state)) {
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
            if (data[i].needRedraw()) {
                return true;
            }
        }

        return false;
    }
}

module.exports = Banner;
