'use strict';

(function (Resource) {

    const parseQueryParameter = (query) => {
        const json = Object.assign({}, query);
        let position, resource;

        for (position in json) {
            if (!json.hasOwnProperty(position)) {
                continue;
            }

            for (resource in json[position]) {
                if (!json[position].hasOwnProperty(resource)) {
                    continue;
                }

                json[position][resource] = json[position][resource].value;
            }
        }

        return JSON.stringify(json);
    };

    class Request {

        constructor(endpoint, locale = null, defaultResources = []) {
            this._method = 'GET';
            this._endpoint = endpoint;
            this._locale = locale;
            this._query = {};
            this._defaultResources = defaultResources;
        }

        addPosition(position, resources = []) {
            if (position in this._query) {
                throw new Error('Position "' + position + '" already exists.');
            }

            this._query[position] = {};

            this.addPositionResources(position, this._defaultResources);
            this.addPositionResources(position, resources);
        }

        addPositionResources(position, resources) {
            let index;

            for (index in resources) {
                if (!resources.hasOwnProperty(index)) {
                    continue;
                }

                this.addPositionResource(position, resources[index]);
            }
        }

        addPositionResource(position, resource) {
            if (!resource instanceof Resource) {
                throw new TypeError('Argument resource must be instance of Resource class.');
            }

            if (!(position in this._query)) {
                throw new Error('Missing position "' + position + '".');
            }

            const queryPosition = this._query[position];

            if (resource.name in queryPosition) {
                queryPosition[resource.name] = queryPosition[resource.name].withValues(resource.value);

                return;
            }

            queryPosition[resource.name] = resource;
        }

        getMethod() {
            return this._method;
        }

        getEndpoint() {
            return this._endpoint;
        }

        getLocale() {
            return this._locale;
        }

        getParameters() {
            const params = {
                query: parseQueryParameter(this._query)
            };

            if (null !== this._locale) {
                params.locale = this._locale;
            }

            return params;
        }
    }

    module.exports = Request;

})(require('./resource'));
