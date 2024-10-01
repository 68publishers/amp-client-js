import { Events } from './events.mjs';

export class EventsConfig {
    constructor(config) {
        const events = {};
        events[Events.BANNER_LOADED] = Events.BANNER_LOADED;
        events[Events.BANNER_DISPLAYED] = Events.BANNER_DISPLAYED;
        events[Events.BANNER_FULLY_DISPLAYED] = Events.BANNER_FULLY_DISPLAYED;
        events[Events.BANNER_CLICKED] = Events.BANNER_CLICKED;
        events[Events.BANNER_CLOSED] = Events.BANNER_CLOSED;

        const params = {
            channel_code: 'channel_code',
            banner_id: 'banner_id',
            banner_name: 'banner_name',
            position_id: 'position_id',
            position_code: 'position_code',
            position_name: 'position_name',
            campaign_id: 'campaign_id',
            campaign_code: 'campaign_code',
            campaign_name: 'campaign_name',
            breakpoint: 'breakpoint',
            link: 'link',
        };

        if ('events' in config) {
            for (let eventKey in config.events) {
                const eventValue = config.events[eventKey];

                if (true === eventValue || !(eventKey in events)) {
                    continue;
                }

                if (false === eventValue || 'string' === typeof eventValue) {
                    events[eventKey] = eventValue;
                }
            }
        }

        if ('params' in config) {
            for (let paramKey in config.params) {
                if (paramKey in params && 'string' === typeof config.params[paramKey]) {
                    params[paramKey] = config.params[paramKey];
                }
            }
        }

        this.events = events;
        this.params = params;
    }
}
