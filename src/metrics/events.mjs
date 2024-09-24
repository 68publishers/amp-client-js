export class Events {
    static get BANNER_LOADED() {
        return 'amp:banner:loaded';
    }

    static get BANNER_DISPLAYED() {
        return 'amp:banner:displayed';
    }

    static get BANNER_FULLY_DISPLAYED() {
        return 'amp:banner:fully-displayed';
    }

    static get BANNER_CLICKED() {
        return 'amp:banner:clicked';
    }

    static get BANNER_CLOSED() {
        return 'amp:banner:closed';
    }

    static get EVENTS() {
        return [
            Events.BANNER_LOADED,
            Events.BANNER_DISPLAYED,
            Events.BANNER_FULLY_DISPLAYED,
            Events.BANNER_CLICKED,
            Events.BANNER_CLOSED,
        ]
    }
}
