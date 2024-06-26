import { Events as MetricsEvents } from './events.mjs';
import { default as plausibleReceiver } from './plausible-receiver.mjs';
import { default as gtagReceiver } from './gtag-receiver.mjs';
import { default as gtmReceiver } from './gtm-receiver.mjs';
import { default as debugReceiver } from './debug-receiver.mjs';

export class MetricsSender {
    #callbacks;
    #disabledEvents;

    /**
     * @param {Array<Function<String, Object>>} callbacks
     * @param {Array<String>} disabledEvents
     */
    constructor(callbacks, disabledEvents) {
        this.#callbacks = Array.isArray(callbacks) ? callbacks : [callbacks];
        this.#disabledEvents = disabledEvents;
    }

    static createFromReceivers(receivers, disabledEvents) {
        if (!receivers) {
            return new MetricsSender([], disabledEvents);
        }

        receivers = Array.isArray(receivers) ? receivers : [receivers];
        const callbacks = [];

        for (let receiver of receivers) {
            if ('function' === typeof receiver) {
                callbacks.push(receiver);
                continue;
            }

            switch (receiver) {
                case 'plausible':
                    callbacks.push(plausibleReceiver);
                    break;
                case 'gtag':
                    callbacks.push(gtagReceiver);
                    break;
                case 'gtm':
                    callbacks.push(gtmReceiver);
                    break;
                case 'debug':
                    callbacks.push(debugReceiver);
                    break;
                default:
                    console.warn(`Unable to send metrics to a receiver of unknown type`, receiver);
            }
        }

        return new MetricsSender(callbacks, disabledEvents);
    }

    hasAnyReceiver() {
        return this.#callbacks.length;
    }

    isEventEnabled(eventName) {
        return -1 !== MetricsEvents.EVENTS.indexOf(eventName) && -1 === this.#disabledEvents.indexOf(eventName);
    }

    send(eventName, eventArgs) {
        if (!this.isEventEnabled(eventName)) {
            return;
        }

        for (let callback of this.#callbacks) {
            callback(eventName, eventArgs);
        }
    }
}
