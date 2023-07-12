const SequenceGenerator = require('../utils/sequence-generator');
const internal = require('../utils/internal-state')();

class EventBus {
    constructor() {
        internal(this).generator = new SequenceGenerator();
        internal(this).listeners = {};
        internal(this).sortedListeners = {};
    }

    subscribe(event, callback, scope = null, priority = 0) {
        if (typeof callback !== 'function') {
            throw new TypeError('Listener must be of type function.');
        }

        const _internal = internal(this);

        const id = 'idx_' + _internal.generator.getNextIdentifier();

        _internal.listeners[event] = _internal.listeners[event] || {};
        _internal.listeners[event][id] = {
            callback: callback,
            scope: scope,
            priority: priority,
        };

        if (event in _internal.sortedListeners) {
            delete _internal.sortedListeners[event];
        }

        return function () {
            if (event in _internal.listeners && id in _internal.listeners[event]) {
                delete _internal.listeners[event][id];
            }
        };
    }

    dispatch(event, ...args) {
        for (let listener of this.getSortedListeners(event)) {
            listener.callback.call(listener.scope, ...args);
        }
    }

    reset() {
        internal(this).listeners = {};
    }

    getSortedListeners(event) {
        if (event in internal(this).sortedListeners) {
            return internal(this).sortedListeners[event];
        }

        const listeners = Object.values(internal(this).listeners[event] || {}).sort((left, right) => {
            return left.priority > right.priority ? -1 : (left.priority < right.priority ? 1 : 0);
        });

        return internal(this).sortedListeners[event] = listeners;
    }
}

module.exports = EventBus;
