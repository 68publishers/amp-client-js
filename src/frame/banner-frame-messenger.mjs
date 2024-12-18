import { FrameMessenger } from './frame-messenger.mjs';
import { EmbedBanner } from '../banner/embed/embed-banner.mjs';

export class BannerFrameMessenger extends FrameMessenger {
    #origin;
    #connectionData;
    #bannerManager;
    #metricsSender;
    #connectedBanners = [];

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

        window.addEventListener('resize', () => {
            const banners = this.#bannerManager.getBannersByState({
                state: this.#bannerManager.STATE.RENDERED,
                managed: false,
                external: false,
                embed: true,
            });

            for (let banner of banners) {
                this.sendToBanner(banner, 'windowResized', {
                    windowWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
                })
            }
        });
    }

    connectBanner(embedBanner) {
        embedBanner.iframe.addEventListener('load', () => {
            const data = this.#connectionData;
            data.uid = embedBanner.uid;
            data.windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

            this.sendToBanner(embedBanner, 'connect', data);
        });
    }

    sendToBanner(embedBanner, message, data) {
        this.send(
            embedBanner.iframe.contentWindow,
            message,
            data,
            this.#origin,
        );
    }

    _beforeDispatch(message, { data }) {
        const { uid } = data;

        if (-1 === this.#connectedBanners.indexOf(uid)) {
            const banner = this.#findBanner(uid);

            if (banner) {
                banner.iframe.style.visibility = 'visible';
                this.#connectedBanners.push(uid);
            }
        }

        return true;
    }

    #onAdjustHeightMessage({ data }) {
        const banner = this.#findBanner(data.uid);

        if (banner) {
            banner.iframe.style.height = data.height + 'px';
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

        if ('fingerprints' in data) {
            banner.updateFingerprints(data.fingerprints);
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

        if (this.#metricsSender.hasAnyReceiver()) {
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
