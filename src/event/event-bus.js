'use strict';

(function (_, SequenceGenerator) {

    class EventBus {
        constructor() {
            this._generator = new SequenceGenerator();
            this._listeners = {};
        }

        subscribe(event, callback, scope = null) {
            if (typeof callback !== 'function') {
                throw new TypeError('Listener must be of type function.');
            }

            const id = 'idx_' + this._generator.getNextIdentifier();

            this._listeners[event] = this._listeners[event] || {};
            this._listeners[event][id] = {
                callback: callback,
                scope: scope
            };

            return function () {
                if (event in this._listeners && id in this._listeners[event]) {
                    delete this._listeners[event][id];
                }
            };
        }

        dispatch(event, ...args) {
            const listeners = this._listeners[event] || {};

            _.forEach(listeners, listener => {
                listener.callback.call(listener.scope, ...args);
            });
        }

        reset() {
            this.listeners = {};
        }
    }

    module.exports = EventBus;

})(require('lodash'), require('../utils/sequence-generator'));
