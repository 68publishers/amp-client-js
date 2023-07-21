const Resource = require('./resource');
const Request = require('./request');
const internal = require('../utils/internal-state')();

class RequestFactory {
    constructor (method, url, version, channel) {
        internal(this).method = method;
        internal(this).endpoint = `${url}/api/v${version}/content/${channel}`;
        internal(this).locale = null;
        internal(this).defaultResources = [];
    }

    set locale(locale) {
        internal(this).locale = locale;
    }

    addDefaultResource(name, value) {
        internal(this).defaultResources.push(new Resource(name, value));
    }

    create() {
        const _internal = internal(this);

        return new Request(_internal.method, _internal.endpoint, _internal.locale, _internal.defaultResources);
    }
}

module.exports = RequestFactory;
