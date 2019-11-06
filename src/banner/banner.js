'use strict';

(function (State, Events) {

    class Banner {

        constructor(eventBus, element, position, resources = []) {
            // constants
            this.STATE = State;

            this._eventBus = eventBus;

            this.element = element;
            this.position = position;
            this.resources = resources;
            this.positionInfo = {};

            this.setState(this.STATE.NEW, 'Banner created.');
        }

        setHtml(html) {
            this.element.innerHTML = html;
        }

        setState(state, info = '') {
            if (!this.STATE.STATES.includes(state)) {
                throw new TypeError(`${state} is not valid state.`);
            }

            this._state = state;
            this._stateInfo = info.toString();

            this._eventBus.dispatch(Events.ON_BANNER_STATE_CHANGER, this);
        }

        getState() {
            return this._state;
        }

        getStateInfo() {
            return this._stateInfo;
        }
    }

    module.exports = Banner;

})(require('./state'), require('../event/events'));
