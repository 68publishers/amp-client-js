'use strict';

(function (Resource, Request) {

    class RequestFactory {

        constructor (url, version, channel) {
            this._endpoint = `${url}/api/v${version}/content/${channel}`;
            this._locale = null;
            this._defaultResources = [];
        }

        setLocale(locale) {
            this._locale = locale;
        }

        addDefaultResource(name, value) {
            this._defaultResources.push(new Resource(name, value));
        }

        create() {
            return new Request(this._endpoint, this._locale, this._defaultResources);
        }
    }

    module.exports = RequestFactory;

})(require('./resource'), require('./request'));
