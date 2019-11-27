'use strict';

(function (Resource, Request, internal) {

    class RequestFactory {

        constructor (url, version, channel) {
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

            return new Request(_internal.endpoint, _internal.locale, _internal.defaultResources);
        }
    }

    module.exports = RequestFactory;

})(require('./resource'), require('./request'), require('../utils/internal-state')());
