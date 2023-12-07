const State = require('./state');
const Events = require('../event/events');
const PositionData = require('./position-data');
const Options = require('./options');
const internal = require('../utils/internal-state');

class Banner {
    constructor(eventBus, uid, element, position, options) {
        if (this.constructor === Banner) {
            throw new TypeError('Can not construct abstract class Banner.');
        }

        // constants
        this.STATE = State;

        internal(this).eventBus = eventBus;
        internal(this).uid = uid;
        internal(this).element = element;
        internal(this).positionData = PositionData.createInitial(position);
        internal(this).options = new Options(options);
        internal(this).stateCounters = {};

        this.setState(this.STATE.NEW, 'Banner created.');
    }

    get uid() {
        return internal(this).uid;
    }

    get element() {
        return internal(this).element;
    }

    get state() {
        return internal(this).state;
    }

    get stateInfo() {
        return internal(this).stateInfo;
    }

    get stateCounter() {
        return internal(this).stateCounters[this.state] || 0;
    }

    get position() {
        return this.positionData.code;
    }

    /**
     * @returns {PositionData}
     */
    get positionData() {
        return internal(this).positionData;
    }

    /**
     * @returns {Options}
     */
    get options() {
        return internal(this).options;
    }

    /**
     * @returns {Array<Fingerprint>}
     */
    get fingerprints() {
        return [];
    }

    setState(state, info = '') {
        if (-1 === this.STATE.STATES.indexOf(state)) {
            throw new TypeError(`${state} is not valid state.`);
        }

        internal(this).state = state;
        internal(this).stateInfo = info.toString();
        internal(this).stateCounters[state] = (internal(this).stateCounters[state] || 0) + 1;

        internal(this).eventBus.dispatch(Events.ON_BANNER_STATE_CHANGED, this);
    }

    /**
     * @returns {number|null}
     */
    getCurrenBreakpoint(bannerId) { // eslint-disable-line no-unused-vars
        return null;
    }

    isManaged() {
        return false;
    }

    isExternal() {
        return false;
    }

    isEmbed() {
        return false;
    }
}

module.exports = Banner;
