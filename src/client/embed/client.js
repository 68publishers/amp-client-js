const { mainConfig, extendedConfig } = require('./config');
const BannerManager = require('../../banner/banner-manager');
const EventBus = require('../../event/event-bus');
const Events = require('../../event/events');
const ParentFrameMessenger = require('../../frame/parent-frame-messenger');
const BannerInteractionWatcher = require("../../interaction/banner-interaction-watcher");
const MetricsSender = require('../../metrics/metrics-sender');
const MetricsEventListener = require("../../metrics/metrics-events-listener");

class Client {
    #version;
    #mainConfig;
    #extendedConfig;
    #eventBus;
    #bannerManager;
    #frameMessenger;
    #bannerInteractionWatcher;
    #metricsSender;
    #metricsEventListener;
    #attached;

    /**
     * @param {ClientVersion} version
     * @param {Object} options
     */
    constructor (version, options) {
        this.EVENTS = Events;
        this.#version = version;
        this.#mainConfig = mainConfig(options);
        this.#extendedConfig = extendedConfig({});
        this.#extendedConfig = null;
        this.#eventBus = new EventBus();
        this.#bannerManager = new BannerManager(this.#eventBus);
        this.#frameMessenger = new ParentFrameMessenger({
            clientEventBus: this.#eventBus,
        });
        this.#attached = false;
        this.#bannerInteractionWatcher = null;
        this.#metricsSender = new MetricsSender(
            [this.#sendMetricsEvent.bind(this)],
            [],
        );
        this.#metricsEventListener = new MetricsEventListener(
            this.#metricsSender,
            this.#eventBus,
            this.#mainConfig.channel,
        );

        this.#frameMessenger.on('connect', ({ data }) => {
            this.#extendedConfig = extendedConfig(data.extendedConfig);
            this.#bannerInteractionWatcher = new BannerInteractionWatcher(
                this.#bannerManager,
                this.#eventBus,
                this.#extendedConfig.interaction,
            );

            this.#bannerInteractionWatcher.start();
        })

        this.#frameMessenger.listen();
        this.#metricsEventListener.attach();
    }

    /**
     * @returns {ClientVersion}
     */
    get version() {
        return this.#version;
    }

    on(event, callback, scope = null) {
        return this.#eventBus.subscribe(event, callback, scope);
    }

    attachBanner() {
        if (this.#attached) {
            throw new Error('Method attachBanner() should be called only once.');
        }

        const element = document.querySelector('[data-amp-banner]:not([data-amp-attached])');

        if (!element) {
            console.warn('No banner not found in the embed client.');

            return;
        }

        const banner = this.#bannerManager.addExternalBanner(element);
        this.#attached = true;

        this.#eventBus.dispatch(this.EVENTS.ON_BANNER_ATTACHED, banner);
    }

    #sendMetricsEvent(eventName, eventArgs) {
        this.#frameMessenger.sendToParent('metrics', {
            eventName,
            eventArgs,
        });
    }
}

module.exports = Client;
