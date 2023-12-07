const EventBus = require('../event/event-bus');

class FrameMessenger {
    #origins;
    #eventBus;

    constructor({ origins = [] }) {
        this.#eventBus = new EventBus();
        this.#origins = origins;
    }

    on(message, callback) {
        this.#eventBus.subscribe(message, callback);
    }

    send(receiver, message, data, origin = '*') {
        receiver.postMessage({ message, data }, origin);
    }

    listen() {
        window.addEventListener('message', event => {
            if ((0 < this.#origins.length && -1 === this.#origins.indexOf(event.origin))
                || 'object' !== typeof event.data
                || !('message' in event.data)
                || !('data' in event.data)
            ) {
                return;
            }

            const { message, data } = event.data;

            this.#eventBus.dispatch(message, {
                data,
                origin: event.origin,
            });
        }, false);
    }
}

module.exports = FrameMessenger;
