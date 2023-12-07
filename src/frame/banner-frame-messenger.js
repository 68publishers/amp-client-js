const FrameMessenger = require('./frame-messenger');
const EmbedBanner = require('../banner/embed/embed-banner');

class BannerFrameMessenger extends FrameMessenger {
    #origin;
    #connectionData;
    #bannerManager;
    #metricsSender;

    /**
     * @param {String} origin
     * @param {Object} connectionData
     * @param {BannerManager} bannerManager
     * @param {MetricsSender} metricsSender
     */
    constructor({ origin, connectionData, bannerManager, metricsSender }) {
        super({
            origins: [origin],
        });

        this.#origin = origin;
        this.#connectionData = connectionData;
        this.#bannerManager = bannerManager;
        this.#metricsSender = metricsSender;

        const handlers = {};
        handlers['adjustHeight'] = this.#onAdjustHeightMessage;
        handlers['stateChanged'] = this.#onStateChangedMessage;
        handlers['linkClicked'] = this.#onLinkClickedMessage;
        handlers['metrics'] = this.#onMetricsMessage;

        for (let message in handlers) {
            this.on(message, handlers[message].bind(this));
        }
    }

    connectBanner(embedBanner) {
        embedBanner.element.addEventListener('load', () => {
            const data = this.#connectionData;
            data.uid = embedBanner.uid;

            this.sendToBanner(embedBanner, 'connect', data);
        });
    }

    sendToBanner(embedBanner, message, data) {
        this.send(
            embedBanner.element.contentWindow,
            message,
            data,
            this.#origin,
        );
    }

    #onAdjustHeightMessage({ data }) {
        const banner = this.#findBanner(data.uid);

        if (banner) {
            banner.element.style.height = data.height + 'px';
        }
    }

    #onStateChangedMessage({ data }) {
        const banner = this.#findBanner(data.uid);

        if (null === banner) {
            return;
        }

        if ('positionData' in data) {
            banner.updatePositionData(data.positionData);
        }

        banner.setState(data.state, `[embed]: ${data.stateInfo}`);
    }

    #onLinkClickedMessage({ data }) {
        const { href, target } = data;

        if ('_blank' === target) {
            window.open(href, target);
        } else {
            window.location.href = href;
        }
    }

    #onMetricsMessage({ data }) {
        const { eventName, eventArgs } = data;

        if (this.#metricsSender.hasAnyReceiver() && this.#metricsSender.isEventEnabled(eventName)) {
            this.#metricsSender.send(eventName, eventArgs);
        }
    }

    #findBanner(uid) {
        const banner = this.#bannerManager.getBannerByUid(uid);

        if (!(banner instanceof EmbedBanner)) {
            console.warn(`Error in communication with embed banner. Embed banner with UID ${uid} not attached.`);

            return null;
        }

        return banner;
    }
}

module.exports = BannerFrameMessenger;
