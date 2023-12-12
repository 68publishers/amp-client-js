import { State } from './state.mjs';
import { Events } from '../event/events.mjs';
import { PositionData } from './position-data.mjs';
import { Options } from './options.mjs';

export class Banner {
    #uid;
    #element;
    #options;
    #state = null;
    #stateInfo = null;
    #stateCounters = {};

    constructor(eventBus, uid, element, position, options) {
        if (this.constructor === Banner) {
            throw new TypeError('Can not construct abstract class Banner.');
        }

        this.#uid = uid;
        this.#element = element;
        this.#options = new Options(options);

        this._eventBus = eventBus;
        this._positionData = PositionData.createInitial(position);

        this.STATE = State;

        this.setState(this.STATE.NEW, 'Banner created.');
    }

    get uid() {
        return this.#uid;
    }

    /**
     * @returns {HTMLElement}
     */
    get element() {
        return this.#element;
    }

    get state() {
        return this.#state;
    }

    get stateInfo() {
        return this.#stateInfo;
    }

    get stateCounter() {
        return this.#stateCounters[this.state] || 0;
    }

    get position() {
        return this.positionData.code;
    }

    /**
     * @returns {PositionData}
     */
    get positionData() {
        return this._positionData;
    }

    /**
     * @returns {Options}
     */
    get options() {
        return this.#options;
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

        this.#state = state;
        this.#stateInfo = info.toString();
        this.#stateCounters[state] = (this.#stateCounters[state] || 0) + 1;

        this._eventBus.dispatch(Events.ON_BANNER_STATE_CHANGED, this);
    }

    /**
     * @returns {number|null}
     */
    getCurrenBreakpoint(bannerId) { // eslint-disable-line no-unused-vars
        return null;
    }

    redrawIfNeeded() {
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
