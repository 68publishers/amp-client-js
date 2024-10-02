import { default as plausibleReceiver } from './plausible-receiver.mjs';
import { default as gtagReceiver } from './gtag-receiver.mjs';
import { default as gtmReceiver } from './gtm-receiver.mjs';
import { default as debugReceiver } from './debug-receiver.mjs';

export class MetricsSender {
    #callbacks;

    /**
     * @param {Array<Function<String, Object>>} callbacks
     */
    constructor(callbacks) {
        this.#callbacks = Array.isArray(callbacks) ? callbacks : [callbacks];
    }

    static createFromReceivers(receivers) {
        if (!receivers) {
            return new MetricsSender([]);
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

        return new MetricsSender(callbacks);
    }

    hasAnyReceiver() {
        return this.#callbacks.length;
    }

    send(eventName, eventArgs) {
        for (let callback of this.#callbacks) {
            callback(eventName, eventArgs);
        }
    }
}
