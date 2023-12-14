import { Resource } from './resource.mjs';
import { default as querystring } from 'query-string';

export class EmbedUrlFactory {
    #endpoint;
    #locale;
    #defaultResources;

    constructor (url, version, channel) {
        this.#endpoint = `${url}/api/v${version}/preview/position/${encodeURIComponent(channel)}`;
        this.#locale = null;
        this.#defaultResources = {};
    }

    set locale(locale) {
        this.#locale = locale;
    }

    addDefaultResource(name, value) {
        const defaultResources = this.#defaultResources;
        const resource = new Resource(name, value);

        if (resource.name in defaultResources) {
            defaultResources[resource.name] = defaultResources[resource.name].withValues(resource.value);

            return;
        }

        defaultResources[resource.name] = resource;
    }

    create(position, resources = {}, options = {}) {
        let allResources;

        if ('1' !== (options['omit-default-resources'] || '0').toString()) {
            allResources = { ...this.#defaultResources };
        } else {
            allResources = {};
            delete options['omit-default-resources'];
        }

        for (let key in resources) {
            const resource = new Resource(key, resources[key]);

            if (resource.name in allResources) {
                allResources[resource.name] = allResources[resource.name].withValues(resource.value);

                continue;
            }

            allResources[resource.name] = resource;
        }

        let resourcesParam = {};

        for (let key in allResources) {
            const value = allResources[key].value.filter(val => '' !== val);

            if (value.length) {
                resourcesParam[key] = allResources[key].value;
            }
        }

        resourcesParam = JSON.stringify(resourcesParam);
        const optionsParam = JSON.stringify(options);
        const params = {};

        if ('{}' !== resourcesParam) {
            params.resources = resourcesParam;
        }

        if ('{}' !== optionsParam) {
            params.options = optionsParam;
        }

        if (null !== this.#locale) {
            params.locale = this.#locale;
        }

        const query = querystring.stringify(params);

        return `${this.#endpoint}/${encodeURIComponent(position)}${'' !== query ? ('?' + query) : ''}`
    }
}
