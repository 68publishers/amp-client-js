const Resource = require('./resource');
const Request = require('./request');
const internal = require('../utils/internal-state');

class RequestFactory {
    constructor (method, url, version, channel) {
        internal(this).method = method;
        internal(this).endpoint = `${url}/api/v${version}/content/${channel}`;
        internal(this).locale = null;
        internal(this).defaultResources = [];
        internal(this).origin = null;
    }

    set locale(locale) {
        internal(this).locale = locale;
    }

    set origin(origin) {
        internal(this).origin = origin;
    }

    addDefaultResource(name, value) {
        internal(this).defaultResources.push(new Resource(name, value));
    }

    create() {
        const _internal = internal(this);
        const headers = [];

        if ('string' === typeof _internal.origin && '' !== _internal.origin) {
            headers.push({
                name: 'X-Amp-Origin',
                value: _internal.origin,
            });
        }

        return new Request(_internal.method, _internal.endpoint, _internal.locale, _internal.defaultResources, headers);
    }
}

module.exports = RequestFactory;
