'use strict';

(function (_, SequenceGenerator, internal) {

    class EventBus {

        constructor() {
            internal(this).generator = new SequenceGenerator();
            internal(this).listeners = {};
        }

        subscribe(event, callback, scope = null) {
            if (typeof callback !== 'function') {
                throw new TypeError('Listener must be of type function.');
            }

            const _internal = internal(this);

            const id = 'idx_' + _internal.generator.getNextIdentifier();

            _internal.listeners[event] = _internal.listeners[event] || {};
            _internal.listeners[event][id] = {
                callback: callback,
                scope: scope
            };

            return function () {
                if (event in _internal.listeners && id in _internal.listeners[event]) {
                    delete _internal.listeners[event][id];
                }
            };
        }

        dispatch(event, ...args) {
            const listeners = internal(this).listeners[event] || {};

            _.forEach(listeners, listener => {
                listener.callback.call(listener.scope, ...args);
            });
        }

        reset() {
            internal(this).listeners = {};
        }
    }

    module.exports = EventBus;

})(require('lodash'), require('../utils/sequence-generator'), require('../utils/internal-state')());
