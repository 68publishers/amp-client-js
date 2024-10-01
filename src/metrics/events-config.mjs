import { Events } from './events.mjs';

export class EventsConfig {
    constructor(config) {
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

        if ('params' in config) {
            for (let paramKey in config.params) {
                if (paramKey in params && 'string' === typeof config.params[paramKey]) {
                    params[paramKey] = config.params[paramKey];
                }
            }
        }

        const extraParams = 'extraParams' in config && 'object' === typeof config.extraParams ? config.extraParams : {};

        const events = {};
        const createEvent = name => ({
            name,
            enabled: true,
            params: {...params},
            extraParams: {...extraParams},
        });

        events[Events.BANNER_LOADED] = createEvent(Events.BANNER_LOADED);
        events[Events.BANNER_DISPLAYED] = createEvent(Events.BANNER_DISPLAYED);
        events[Events.BANNER_FULLY_DISPLAYED] = createEvent(Events.BANNER_FULLY_DISPLAYED);
        events[Events.BANNER_CLICKED] = createEvent(Events.BANNER_CLICKED);
        events[Events.BANNER_CLOSED] = createEvent(Events.BANNER_CLOSED);

        if ('events' in config) {
            for (let eventKey in config.events) {
                const eventValue = config.events[eventKey];

                if (true === eventValue || !(eventKey in events)) {
                    continue;
                }

                if (false === eventValue) {
                    events[eventKey].enabled = false;

                    continue;
                }

                if ('string' === typeof eventValue) {
                    events[eventKey].name = eventValue;

                    continue;
                }

                if ('object' !== typeof eventValue) {
                    continue;
                }

                'name' in eventValue && 'string' === typeof eventValue.name && (events[eventKey].name = eventValue.name);

                if ('params' in eventValue && 'object' == typeof eventValue.params) {
                    for (let paramKey in eventValue.params) {
                        if (paramKey in events[eventKey].params && 'string' === typeof eventValue.params[paramKey]) {
                            events[eventKey].params[paramKey] = eventValue.params[paramKey];
                        }
                    }
                }

                if ('extraParams' in eventValue && 'object' == typeof eventValue.extraParams) {
                    events[eventKey].extraParams = {
                        ...events[eventKey].extraParams,
                        ...eventValue.extraParams,
                    }
                }
            }
        }

        this.events = events;
    }
}
