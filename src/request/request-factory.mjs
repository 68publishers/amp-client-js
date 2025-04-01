import { Resource } from './resource.mjs';
import { Request } from './request.mjs';

export class RequestFactory {
    #method;
    #endpoint;
    #locale;
    #version;
    #defaultResources;
    #origin;

    constructor (method, url, version, channel) {
        this.#method = method;
        this.#endpoint = `${url}/api/v${version}/content/${encodeURIComponent(channel)}`;
        this.#locale = null;
        this.#version = version;
        this.#defaultResources = [];
        this.#origin = null;
    }

    set locale(locale) {
        this.#locale = locale;
    }

    set origin(origin) {
        this.#origin = origin;
    }

    addDefaultResource(name, value) {
        this.#defaultResources.push(new Resource(name, value));
    }

    create() {
        const headers = [];

        if ('string' === typeof this.#origin && '' !== this.#origin) {
            headers.push({
                name: 'X-Amp-Origin',
                value: this.#origin,
            });
        }

        return new Request({
            method: this.#method,
            endpoint: this.#endpoint,
            version: this.#version,
            locale: this.#locale,
            defaultResources: this.#defaultResources,
            headers,
        });
    }
}
