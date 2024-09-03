import { Events as MetricsEvents } from './events.mjs';
import { Events } from '../event/events.mjs';
import { State } from '../banner/state.mjs';

export class MetricsEventsListener {
    #metricsSender;
    #eventBus;
    #channelCode;
    #attached;

    /**
     * @param {MetricsSender} metricsSender
     * @param {EventBus} eventBus
     * @param {String} channelCode
     */
    constructor(metricsSender, eventBus, channelCode) {
        this.#metricsSender = metricsSender;
        this.#eventBus = eventBus;
        this.#channelCode = channelCode;
        this.#attached = false;
    }

    attach() {
        if (this.#attached) {
            return;
        }

        this.#attached = true;

        const eventBus = this.#eventBus;
        const channelCode = this.#channelCode;
        const metricsSender = this.#metricsSender;

        if (!metricsSender.hasAnyReceiver()) {
            return;
        }

        const createBaseMetricsArgs = (fingerprint, banner) => {
            let breakpoint = banner.getCurrenBreakpoint(fingerprint.bannerId);
            breakpoint = null === breakpoint ? 'default' : `${'min' === banner.positionData.breakpointType ? '>=' : '<='}${breakpoint}`;

            return {
                channel_code: channelCode,
                banner_id: fingerprint.bannerId,
                banner_name: fingerprint.bannerName,
                position_id: fingerprint.positionId,
                position_code: fingerprint.positionCode,
                position_name: fingerprint.positionName,
                campaign_id: fingerprint.campaignId,
                campaign_code: fingerprint.campaignCode,
                campaign_name: fingerprint.campaignName,
                breakpoint: breakpoint,
            }
        };

        if (metricsSender.isEventEnabled(MetricsEvents.BANNER_LOADED)) {
            eventBus.subscribe(Events.ON_BANNER_STATE_CHANGED, ({ banner }) => {
                if (banner.isEmbed() || State.RENDERED !== banner.state || 1 !== banner.stateCounter) {
                    return;
                }

                for (let fingerprint of banner.fingerprints) {
                    metricsSender.send(MetricsEvents.BANNER_LOADED, createBaseMetricsArgs(fingerprint, banner));
                }
            });
        }

        if (metricsSender.isEventEnabled(MetricsEvents.BANNER_DISPLAYED)) {
            eventBus.subscribe(Events.ON_BANNER_FIRST_TIME_SEEN, ({ fingerprint, banner }) => {
                metricsSender.send(MetricsEvents.BANNER_DISPLAYED, createBaseMetricsArgs(fingerprint, banner));
            });
        }

        if (metricsSender.isEventEnabled(MetricsEvents.BANNER_FULLY_DISPLAYED)) {
            eventBus.subscribe(Events.ON_BANNER_FIRST_TIME_FULLY_SEEN, ({ fingerprint, banner }) => {
                metricsSender.send(MetricsEvents.BANNER_FULLY_DISPLAYED, createBaseMetricsArgs(fingerprint, banner));
            });
        }

        if (metricsSender.isEventEnabled(MetricsEvents.BANNER_CLICKED)) {
            eventBus.subscribe(Events.ON_BANNER_LINK_CLICKED, ({ fingerprint, banner, target }) => {
                metricsSender.send(MetricsEvents.BANNER_CLICKED, {
                    ...createBaseMetricsArgs(fingerprint, banner),
                    link: target.href || '',
                })
            });
        }

        if (metricsSender.isEventEnabled(MetricsEvents.BANNER_CLOSED)) {
            eventBus.subscribe(Events.ON_BANNER_AFTER_CLOSE, ({ fingerprint, banner }) => {
                metricsSender.send(MetricsEvents.BANNER_CLOSED, createBaseMetricsArgs(fingerprint, banner));
            });
        }
    }
}
