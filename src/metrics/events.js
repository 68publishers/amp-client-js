class Events {
    static get BANNER_LOADED() {
        return 'amp:banner:loaded';
    }

    static get BANNER_DISPLAYED() {
        return 'amp:banner:displayed';
    }

    static get BANNER_CLICKED() {
        return 'amp:banner:clicked';
    }
}

module.exports = Events;
