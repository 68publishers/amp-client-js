const internal = require('../utils/internal-state')();
const MetricsSender = require('./metrics-sender');
const MetricsEvents = require('./events');
const Events = require('../event/events');
const State = require('../banner/state');

class MetricsEventsListener {
    constructor(eventBus, channelCode, metricsOptions) {
        const receivers = metricsOptions.receiver;
        let disabledEvents = metricsOptions.disabledEvents || [];
        disabledEvents = '[object Array]' !== Object.prototype.toString.call(disabledEvents) ? [disabledEvents] : disabledEvents;

        internal(this).attached = false;
        internal(this).eventBus = eventBus;
        internal(this).channelCode = channelCode;
        internal(this).metricsSender = MetricsSender.createFromReceivers(receivers);
        internal(this).disabledEvents = disabledEvents;
    }

    attach() {
        if (internal(this).attached) {
            return;
        }

        internal(this).attached = true;

        const eventBus = internal(this).eventBus;
        const channelCode = internal(this).channelCode;
        const metricsSender = internal(this).metricsSender;
        const disabledEvents = internal(this).disabledEvents;

        if (!metricsSender.hasAnyReceiver()) {
            return;
        }

        if (-1 === disabledEvents.indexOf(MetricsEvents.BANNER_LOADED)) {
            eventBus.subscribe(Events.ON_BANNER_STATE_CHANGED, banner => {
                if (State.RENDERED !== banner.state || 1 !== banner.htmlChangedCounter) {
                    return;
                }

                for (let fingerprint of banner.fingerprints) {
                    metricsSender.send(MetricsEvents.BANNER_LOADED, {
                        banner_id: fingerprint.bannerId,
                        channel_code: channelCode,
                        position_code: fingerprint.positionCode,
                        campaign_code: fingerprint.campaignCode,
                    });
                }
            });
        }

        if (-1 === disabledEvents.indexOf(MetricsEvents.BANNER_DISPLAYED)) {
            eventBus.subscribe(Events.ON_BANNER_FIRST_SEEN, ({ fingerprint }) => {
                metricsSender.send(MetricsEvents.BANNER_DISPLAYED, {
                    banner_id: fingerprint.bannerId,
                    channel_code: channelCode,
                    position_code: fingerprint.positionCode,
                    campaign_code: fingerprint.campaignCode,
                });
            });
        }

        if (-1 === disabledEvents.indexOf(MetricsEvents.BANNER_CLICKED)) {
            eventBus.subscribe(Events.ON_BANNER_LINK_CLICKED, ({ fingerprint, target }) => {
                metricsSender.send(MetricsEvents.BANNER_CLICKED, {
                    banner_id: fingerprint.bannerId,
                    channel_code: channelCode,
                    position_code: fingerprint.positionCode,
                    campaign_code: fingerprint.campaignCode,
                    link: target.href || '',
                })
            });
        }
    }
}

module.exports = MetricsEventsListener;
