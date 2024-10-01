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
        if (this.#beforeAttachedQueue.started) {
            return;
        }

        this.#beforeAttachedQueue.started = true;

        const eventBus = this.#eventBus;
        const config = new EventsConfig({});

        this.#beforeAttachedQueue.cleanup.push(
            eventBus.subscribe(Events.ON_BANNER_STATE_CHANGED, ({ banner }) => {
                if (banner.isEmbed() || State.RENDERED !== banner.state || 1 !== banner.stateCounter) {
                    return;
                }

                for (let fingerprint of banner.fingerprints) {
                    this.#beforeAttachedQueue.events.push({
                        name: MetricsEvents.BANNER_LOADED,
                        params: this.#createBaseMetricsParams({ config, fingerprint, banner }),
                    });
                }
            }),
        );

        this.#beforeAttachedQueue.cleanup.push(
            eventBus.subscribe(Events.ON_BANNER_FIRST_TIME_SEEN, ({ fingerprint, banner }) => {
                this.#beforeAttachedQueue.events.push({
                    name: MetricsEvents.BANNER_DISPLAYED,
                    params: this.#createBaseMetricsParams({ config, fingerprint, banner }),
                });
            }),
        );

        this.#beforeAttachedQueue.cleanup.push(
            eventBus.subscribe(Events.ON_BANNER_FIRST_TIME_FULLY_SEEN, ({ fingerprint, banner }) => {
                this.#beforeAttachedQueue.events.push({
                    name: MetricsEvents.BANNER_FULLY_DISPLAYED,
                    params: this.#createBaseMetricsParams({ config, fingerprint, banner }),
                });
            }),
        );

        this.#beforeAttachedQueue.cleanup.push(
            eventBus.subscribe(Events.ON_BANNER_LINK_CLICKED, ({ fingerprint, banner, target }) => {
                const params = this.#createBaseMetricsParams({ config, fingerprint, banner });
                params[config.params.link] = target.href || '';

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
                    params: this.#createBaseMetricsParams({ config, fingerprint, banner }),
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

        const bannerLoadedEventName = config.events[MetricsEvents.BANNER_LOADED];
        const bannerDisplayedEventName = config.events[MetricsEvents.BANNER_DISPLAYED];
        const bannerFullyDisplayedEventName = config.events[MetricsEvents.BANNER_FULLY_DISPLAYED];
        const bannerClickedEventName = config.events[MetricsEvents.BANNER_CLICKED];
        const bannerClosedEventName = config.events[MetricsEvents.BANNER_CLOSED];

        if (this.#beforeAttachedQueue.started) {
            for (let i in this.#beforeAttachedQueue.events) {
                const { name, params } = this.#beforeAttachedQueue.events[i];

                if (false === config.events[name]) {
                    continue;
                }

                const mappedParams = {};

                for (let paramKey in params) {
                    mappedParams[config.params[paramKey]] = params[paramKey];
                }

                metricsSender.send(config.events[name], mappedParams);
            }

            this.#clearBeforeAttachedQueue();
        }

        if (false !== bannerLoadedEventName) {
            eventBus.subscribe(Events.ON_BANNER_STATE_CHANGED, ({ banner }) => {
                if (banner.isEmbed() || State.RENDERED !== banner.state || 1 !== banner.stateCounter) {
                    return;
                }

                for (let fingerprint of banner.fingerprints) {
                    metricsSender.send(bannerLoadedEventName, this.#createBaseMetricsParams({ config, fingerprint, banner }));
                }
            });
        }

        if (false !== bannerDisplayedEventName) {
            eventBus.subscribe(Events.ON_BANNER_FIRST_TIME_SEEN, ({ fingerprint, banner }) => {
                metricsSender.send(bannerDisplayedEventName, this.#createBaseMetricsParams({ config, fingerprint, banner }));
            });
        }

        if (false !== bannerFullyDisplayedEventName) {
            eventBus.subscribe(Events.ON_BANNER_FIRST_TIME_FULLY_SEEN, ({ fingerprint, banner }) => {
                metricsSender.send(bannerFullyDisplayedEventName, this.#createBaseMetricsParams({ config, fingerprint, banner }));
            });
        }

        if (false !== bannerClickedEventName) {
            eventBus.subscribe(Events.ON_BANNER_LINK_CLICKED, ({ fingerprint, banner, target }) => {
                const params = this.#createBaseMetricsParams({ config, fingerprint, banner });
                params[config.params.link] = target.href || '';

                metricsSender.send(bannerClickedEventName, params);
            });
        }

        if (false !== bannerClosedEventName) {
            eventBus.subscribe(Events.ON_BANNER_AFTER_CLOSE, ({ fingerprint, banner }) => {
                metricsSender.send(bannerClosedEventName, this.#createBaseMetricsParams({ config, fingerprint, banner }));
            });
        }
    }

    /**
     * @param {EventsConfig} config
     * @param {Fingerprint} fingerprint
     * @param {Banner} banner
     *
     * @return {Object}
     */
    #createBaseMetricsParams = ({ config, fingerprint, banner }) => {
        let breakpoint = banner.getCurrentBreakpoint(fingerprint.bannerId);
        breakpoint = null === breakpoint ? 'default' : `${'min' === banner.positionData.breakpointType ? '>=' : '<='}${breakpoint}`;

        const params = {};
        params[config.params.channel_code] = this.#channelCode;
        params[config.params.banner_id] = fingerprint.bannerId;
        params[config.params.banner_name] = fingerprint.bannerName;
        params[config.params.position_id] = fingerprint.positionId;
        params[config.params.position_code] = fingerprint.positionCode;
        params[config.params.position_name] = fingerprint.positionName;
        params[config.params.campaign_id] = fingerprint.campaignId;
        params[config.params.campaign_code] = fingerprint.campaignCode;
        params[config.params.campaign_name] = fingerprint.campaignName;
        params[config.params.breakpoint] = breakpoint;

        return params;
    };

    #clearBeforeAttachedQueue() {
        for (let i in this.#beforeAttachedQueue.cleanup) {
            this.#beforeAttachedQueue.cleanup[i]();
        }

        this.#beforeAttachedQueue.events = [];
        this.#beforeAttachedQueue.cleanup = [];
    }
}
