const internal = require('../utils/internal-state')();
const plausibleReceiver = require('./plausible-receiver');
const gtagReceiver = require('./gtag-receiver');
const gtmReceiver = require('./gtm-receiver');
const debugReceiver = require('./debug-receiver');

class MetricsSender {
    constructor(callbacks) {
        internal(this).callbacks = Array.isArray(callbacks) ? callbacks : [callbacks];
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
        return internal(this).callbacks.length;
    }

    send(eventName, eventArgs) {
        for (let callback of internal(this).callbacks) {
            callback(eventName, eventArgs);
        }
    }
}

module.exports = MetricsSender;
