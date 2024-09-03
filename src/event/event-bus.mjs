import { SequenceGenerator } from '../utils/sequence-generator.mjs';

export class EventBus {
    #generator;
    #listeners;
    #sortedListeners;

    constructor() {
        this.#generator = new SequenceGenerator();
        this.#listeners = {};
        this.#sortedListeners = {};
    }

    subscribe(event, callback, scope = null, priority = 0) {
        if (typeof callback !== 'function') {
            throw new TypeError('Listener must be of type function.');
        }

        const id = 'idx_' + this.#generator.getNextIdentifier();

        this.#listeners[event] = this.#listeners[event] || {};
        this.#listeners[event][id] = {
            callback: callback,
            scope: scope,
            priority: priority,
        };

        if (event in this.#sortedListeners) {
            delete this.#sortedListeners[event];
        }

        return () => {
            if (event in this.#listeners && id in this.#listeners[event]) {
                delete this.#listeners[event][id];
            }
        };
    }

    dispatch(event, ...args) {
        for (let listener of this.getSortedListeners(event)) {
            null !== listener.scope ? listener.callback.call(listener.scope, ...args) : (listener.callback)(...args);
        }
    }

    reset() {
        this.#listeners = {};
    }

    getSortedListeners(event) {
        if (event in this.#sortedListeners) {
            return this.#sortedListeners[event];
        }

        const listeners = Object.values(this.#listeners[event] || {}).sort((left, right) => {
            return left.priority > right.priority ? -1 : (left.priority < right.priority ? 1 : 0);
        });

        return this.#sortedListeners[event] = listeners;
    }
}
