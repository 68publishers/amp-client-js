import { FrameMessenger } from './frame-messenger.mjs';
import { Events } from '../event/events.mjs';
import { State } from '../banner/state.mjs';

export class ParentFrameMessenger extends FrameMessenger {
    #clientEventBus;
    #origin;
    #uid;
    #parentMessagesQueue;

    /**
     * @param {EventBus} clientEventBus
     * @param {String|undefined} origin
     */
    constructor({ clientEventBus, origin = undefined }) {
        super({
            origins: undefined !== origin ? [origin] : [],
        });

        this.#clientEventBus = clientEventBus;
        this.#origin = origin;
        this.#uid = null;
        this.#parentMessagesQueue = [];

        const messageHandlers = {};
        messageHandlers['connect'] = this.#onConnectMessage;

        const eventHandlers = {};
        eventHandlers[Events.ON_BANNER_STATE_CHANGED] = [this.#onBannerStateChangeEvent, 0];
        eventHandlers[Events.ON_BANNER_LINK_CLICKED] = [this.#onBannerLinkClickedEvent, -100];

        for (let eventName in eventHandlers) {
            this.#clientEventBus.subscribe(eventName, eventHandlers[eventName][0].bind(this), null, eventHandlers[eventName][1]);
        }

        for (let message in messageHandlers) {
            this.on(message, messageHandlers[message].bind(this));
        }
    }

    sendToParent(message, data) {
        if (null === this.#uid) {
            this.#parentMessagesQueue.push({ message, data });

            return;
        }

        data.uid = this.#uid;

        this.send(
            window.parent,
            message,
            data,
            this.#origin || '*',
        );
    }

    #onConnectMessage({ data }) {
        if (null !== this.#uid) {
            console.warn(`The frame is already connected to the parent under the UID ${this.#uid}.`);

            return;
        }

        const { uid } = data;
        this.#uid = uid;

        let currentHeight = undefined;
        const adjustHeight = () => {
            const height = document.body.scrollHeight;

            if (currentHeight !== height) {
                currentHeight = height;
                this.sendToParent('adjustHeight', {
                    height: height,
                });
            }
        }

        adjustHeight();
        setInterval(adjustHeight, 100);

        this.#releaseQueuedParentMessages();
    }

    #onBannerStateChangeEvent(banner) {
        if (State.NEW === banner.state) {
            return;
        }

        const data = {
            state: banner.state,
            stateInfo: banner.stateInfo,
        };

        if (1 === banner.stateCounter) {
            data.positionData = banner.positionData.toObject();
        }

        this.sendToParent('stateChanged', data);
    }

    #onBannerLinkClickedEvent({ target, clickEvent }) {
        clickEvent.preventDefault();

        this.sendToParent('linkClicked', {
            href: target.href,
            target: target.target || null,
        });
    }

    #releaseQueuedParentMessages() {
        for (let message of this.#parentMessagesQueue) {
            this.sendToParent(message.message, message.data);
        }

        this.#parentMessagesQueue = [];
    }
}
