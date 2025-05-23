import { Resource } from './resource.mjs';

export class Request {
    #method;
    #endpoint;
    #version;
    #locale;
    #query;
    #defaultResources;
    #headers;

    constructor({ method, endpoint, version, locale = null, defaultResources = [], headers = [] }) {
        this.#method = method;
        this.#endpoint = endpoint;
        this.#version = version;
        this.#locale = locale;
        this.#query = {};
        this.#defaultResources = defaultResources;
        this.#headers = headers;
    }

    addPosition(position, resources = [], applyDefaultResources = true) {
        const query = this.#query;

        if (position in query) {
            throw new Error('Position "' + position + '" already exists.');
        }

        query[position] = {};

        if (applyDefaultResources) {
            this.addPositionResources(position, this.#defaultResources);
        }

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

        const query = this.#query;

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
        return this.#method;
    }

    get endpoint() {
        return this.#endpoint;
    }

    get version() {
        return this.#version;
    }

    get locale() {
        return this.#locale;
    }

    get parameters() {
        const queryParameter = this.#parseQueryParameter(this.#query);
        const params = {
            query: 'GET' === this.method ? JSON.stringify(queryParameter) : queryParameter,
        };

        if (null !== this.locale) {
            params.locale = this.locale;
        }

        return params;
    }

    get headers() {
        return this.#headers;
    }

    #parseQueryParameter = (query) => {
        const json = {};

        for (let position in query) {
            json[position] = {};

            for (let resource in query[position]) {
                const value = query[position][resource].value.filter(val => '' !== val);

                if (value.length) {
                    json[position][resource] = value;
                }
            }
        }

        return json;
    }
}
