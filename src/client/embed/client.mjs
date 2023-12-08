import { createMainConfig, createExtendedConfig } from './config.mjs';
import { BannerManager } from '../../banner/banner-manager.mjs';
import { EventBus } from '../../event/event-bus.mjs';
import { Events } from '../../event/events.mjs';
import { ParentFrameMessenger } from '../../frame/parent-frame-messenger.mjs';
import { BannerInteractionWatcher } from '../../interaction/banner-interaction-watcher.mjs';
import { MetricsSender } from '../../metrics/metrics-sender.mjs';
import { MetricsEventsListener } from '../../metrics/metrics-events-listener.mjs';

export class Client {
    #version;
    #mainConfig;
    #extendedConfig;
    #eventBus;
    #bannerManager;
    #frameMessenger;
    #bannerInteractionWatcher;
    #metricsSender;
    #metricsEventsListener;
    #attached;

    /**
     * @param {ClientVersion} version
     * @param {Object} options
     */
    constructor (version, options) {
        this.EVENTS = Events;

        this.#version = version;
        this.#mainConfig = createMainConfig(options);
        this.#extendedConfig = createExtendedConfig({});
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
        this.#metricsEventsListener = new MetricsEventsListener(
            this.#metricsSender,
            this.#eventBus,
            this.#mainConfig.channel,
        );

        this.#frameMessenger.on('connect', ({ data }) => {
            this.#extendedConfig = createExtendedConfig(data.extendedConfig);
            this.#bannerInteractionWatcher = new BannerInteractionWatcher(
                this.#bannerManager,
                this.#eventBus,
                this.#extendedConfig.interaction,
            );

            this.#bannerInteractionWatcher.start();
        })

        this.#frameMessenger.listen();
        this.#metricsEventsListener.attach();
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
