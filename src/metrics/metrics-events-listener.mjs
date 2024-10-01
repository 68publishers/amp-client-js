import { Events as MetricsEvents } from './events.mjs';
import { EventsConfig } from './events-config.mjs';
import { Events } from '../event/events.mjs';
import { State } from '../banner/state.mjs';

export class MetricsEventsListener {
    #metricsSender;
    #eventBus;
    #channelCode;
    #attached;
    #beforeAttachedQueue = {
        started: false,
        events: [],
        cleanup: [],
    };

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

    collectBeforeAttach() {
        if (this.#beforeAttachedQueue.started || this.#attached) {
            return;
        }

        this.#beforeAttachedQueue.started = true;

        const eventBus = this.#eventBus;
        const config = new EventsConfig({});

        const bannerLoadedEvent = config.events[MetricsEvents.BANNER_LOADED];
        const bannerDisplayedEvent = config.events[MetricsEvents.BANNER_DISPLAYED];
        const bannerFullyDisplayedEvent = config.events[MetricsEvents.BANNER_FULLY_DISPLAYED];
        const bannerClickedEvent = config.events[MetricsEvents.BANNER_CLICKED];
        const bannerClosedEvent = config.events[MetricsEvents.BANNER_CLOSED];

        this.#beforeAttachedQueue.cleanup.push(
            eventBus.subscribe(Events.ON_BANNER_STATE_CHANGED, ({ banner }) => {
                if (banner.isEmbed() || State.RENDERED !== banner.state || 1 !== banner.stateCounter) {
                    return;
                }

                for (let fingerprint of banner.fingerprints) {
                    this.#beforeAttachedQueue.events.push({
                        name: MetricsEvents.BANNER_LOADED,
                        params: this.#createBaseMetricsParams({ event: bannerLoadedEvent, fingerprint, banner }),
                    });
                }
            }),
        );

        this.#beforeAttachedQueue.cleanup.push(
            eventBus.subscribe(Events.ON_BANNER_FIRST_TIME_SEEN, ({ fingerprint, banner }) => {
                this.#beforeAttachedQueue.events.push({
                    name: MetricsEvents.BANNER_DISPLAYED,
                    params: this.#createBaseMetricsParams({ event: bannerDisplayedEvent, fingerprint, banner }),
                });
            }),
        );

        this.#beforeAttachedQueue.cleanup.push(
            eventBus.subscribe(Events.ON_BANNER_FIRST_TIME_FULLY_SEEN, ({ fingerprint, banner }) => {
                this.#beforeAttachedQueue.events.push({
                    name: MetricsEvents.BANNER_FULLY_DISPLAYED,
                    params: this.#createBaseMetricsParams({ event: bannerFullyDisplayedEvent, fingerprint, banner }),
                });
            }),
        );

        this.#beforeAttachedQueue.cleanup.push(
            eventBus.subscribe(Events.ON_BANNER_LINK_CLICKED, ({ fingerprint, banner, target }) => {
                const params = this.#createBaseMetricsParams({ event: bannerClickedEvent, fingerprint, banner });
                params[bannerClickedEvent.params.link] = target.href || '';

                this.#beforeAttachedQueue.events.push({
                    name: MetricsEvents.BANNER_CLICKED,
                    params: params,
                });
            }),
        );

        this.#beforeAttachedQueue.cleanup.push(
            eventBus.subscribe(Events.ON_BANNER_AFTER_CLOSE, ({ fingerprint, banner }) => {
                this.#beforeAttachedQueue.events.push({
                    name: MetricsEvents.BANNER_CLOSED,
                    params: this.#createBaseMetricsParams({ event: bannerClosedEvent, fingerprint, banner }),
                });
            }),
        );
    }

    /**
     * @param {EventsConfig} config
     */
    attach(config) {
        if (this.#attached) {
            return;
        }

        this.#attached = true;

        const eventBus = this.#eventBus;
        const metricsSender = this.#metricsSender;

        if (!metricsSender.hasAnyReceiver()) {
            this.#clearBeforeAttachedQueue();

            return;
        }

        const bannerLoadedEvent = config.events[MetricsEvents.BANNER_LOADED];
        const bannerDisplayedEvent = config.events[MetricsEvents.BANNER_DISPLAYED];
        const bannerFullyDisplayedEvent = config.events[MetricsEvents.BANNER_FULLY_DISPLAYED];
        const bannerClickedEvent = config.events[MetricsEvents.BANNER_CLICKED];
        const bannerClosedEvent = config.events[MetricsEvents.BANNER_CLOSED];

        if (this.#beforeAttachedQueue.started) {
            for (let i in this.#beforeAttachedQueue.events) {
                const { name, params } = this.#beforeAttachedQueue.events[i];
                const event = config.events[name];

                if (!event.enabled) {
                    continue;
                }

                const mappedParams = {};

                for (let paramKey in params) {
                    mappedParams[event.params[paramKey]] = params[paramKey];
                }

                metricsSender.send(event.name, { ...mappedParams, ...event.extraParams });
            }

            this.#clearBeforeAttachedQueue();
        }

        if (bannerLoadedEvent.enabled) {
            eventBus.subscribe(Events.ON_BANNER_STATE_CHANGED, ({ banner }) => {
                if (banner.isEmbed() || State.RENDERED !== banner.state || 1 !== banner.stateCounter) {
                    return;
                }

                for (let fingerprint of banner.fingerprints) {
                    metricsSender.send(bannerLoadedEvent.name, this.#createBaseMetricsParams({ event: bannerLoadedEvent, fingerprint, banner }));
                }
            });
        }

        if (bannerDisplayedEvent.enabled) {
            eventBus.subscribe(Events.ON_BANNER_FIRST_TIME_SEEN, ({ fingerprint, banner }) => {
                metricsSender.send(bannerDisplayedEvent.name, this.#createBaseMetricsParams({ event: bannerDisplayedEvent, fingerprint, banner }));
            });
        }

        if (bannerFullyDisplayedEvent.enabled) {
            eventBus.subscribe(Events.ON_BANNER_FIRST_TIME_FULLY_SEEN, ({ fingerprint, banner }) => {
                metricsSender.send(bannerFullyDisplayedEvent.name, this.#createBaseMetricsParams({ event: bannerFullyDisplayedEvent, fingerprint, banner }));
            });
        }

        if (bannerClickedEvent.enabled) {
            eventBus.subscribe(Events.ON_BANNER_LINK_CLICKED, ({ fingerprint, banner, target }) => {
                const params = this.#createBaseMetricsParams({ event: bannerClickedEvent, fingerprint, banner });
                params[bannerClickedEvent.params.link] = target.href || '';

                metricsSender.send(bannerClickedEvent.name, params);
            });
        }

        if (bannerClosedEvent.enabled) {
            eventBus.subscribe(Events.ON_BANNER_AFTER_CLOSE, ({ fingerprint, banner }) => {
                metricsSender.send(bannerClosedEvent.name, this.#createBaseMetricsParams({ event: bannerClosedEvent, fingerprint, banner }));
            });
        }
    }

    #createBaseMetricsParams = ({ event, fingerprint, banner }) => {
        let breakpoint = banner.getCurrentBreakpoint(fingerprint.bannerId);
        breakpoint = null === breakpoint ? 'default' : `${'min' === banner.positionData.breakpointType ? '>=' : '<='}${breakpoint}`;

        const params = {};
        params[event.params.channel_code] = this.#channelCode;
        params[event.params.banner_id] = fingerprint.bannerId;
        params[event.params.banner_name] = fingerprint.bannerName;
        params[event.params.position_id] = fingerprint.positionId;
        params[event.params.position_code] = fingerprint.positionCode;
        params[event.params.position_name] = fingerprint.positionName;
        params[event.params.campaign_id] = fingerprint.campaignId;
        params[event.params.campaign_code] = fingerprint.campaignCode;
        params[event.params.campaign_name] = fingerprint.campaignName;
        params[event.params.breakpoint] = breakpoint;

        return {
            ...params,
            ...event.extraParams,
        };
    };

    #clearBeforeAttachedQueue() {
        for (let i in this.#beforeAttachedQueue.cleanup) {
            this.#beforeAttachedQueue.cleanup[i]();
        }

        this.#beforeAttachedQueue.events = [];
        this.#beforeAttachedQueue.cleanup = [];
    }
}
