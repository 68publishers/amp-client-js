const Resource = require('./resource');
const internal = require('../utils/internal-state')();

const parseQueryParameter = (query) => {
    const json = Object.assign({}, query);
    let position, resource;

    for (position in json) {
        for (resource in json[position]) {
            json[position][resource] = json[position][resource].value;
        }
    }

    return json;
};

class Request {
    constructor(method, endpoint, locale = null, defaultResources = []) {
        internal(this).method = method;
        internal(this).endpoint = endpoint;
        internal(this).locale = locale;
        internal(this).query = {};
        internal(this).defaultResources = defaultResources;
    }

    addPosition(position, resources = []) {
        const query = internal(this).query;

        if (position in query) {
            throw new Error('Position "' + position + '" already exists.');
        }

        query[position] = {};

        this.addPositionResources(position, internal(this).defaultResources);
        this.addPositionResources(position, resources);
    }

    addPositionResources(position, resources) {
        for (let index in resources) {
            this.addPositionResource(position, resources[index]);
        }
    }

    addPositionResource(position, resource) {
        if (!(resource instanceof Resource)) {
            throw new TypeError('Argument resource must be instance of Resource class.');
        }

        const query = internal(this).query;

        if (!(position in query)) {
            throw new Error('Missing position "' + position + '".');
        }

        const queryPosition = query[position];

        if (resource.name in queryPosition) {
            queryPosition[resource.name] = queryPosition[resource.name].withValues(resource.value);

            return;
        }

        queryPosition[resource.name] = resource;
    }

    get method() {
        return internal(this).method;
    }

    get endpoint() {
        return internal(this).endpoint;
    }

    get locale() {
        return internal(this).locale;
    }

    get parameters() {
        const queryParameter = parseQueryParameter(internal(this).query);
        const params = {
            query: 'GET' === this.method ? JSON.stringify(queryParameter) : queryParameter,
        };

        if (null !== this.locale) {
            params.locale = this.locale;
        }

        return params;
    }
}

module.exports = Request;
