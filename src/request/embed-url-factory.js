const internal = require('../utils/internal-state');
const Resource = require("./resource");
const querystring = require('query-string').default;

class EmbedUrlFactory {
    constructor (url, channel) {
        internal(this).endpoint = `${url}/preview/position/${encodeURIComponent(channel)}`;
        internal(this).locale = null;
        internal(this).defaultResources = {};
    }

    set locale(locale) {
        internal(this).locale = locale;
    }

    addDefaultResource(name, value) {
        const defaultResources = internal(this).defaultResources;
        const resource = new Resource(name, value);

        if (resource.name in defaultResources) {
            defaultResources[resource.name] = defaultResources[resource.name].withValues(resource.value);

            return;
        }

        defaultResources[resource.name] = resource;
    }

    create(position, resources = {}, options = {}) {
        const props = internal(this);
        const allResources = props.defaultResources;

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
            resourcesParam[key] = allResources[key].value;
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

        if (null !== props.locale) {
            params.locale = props.locale;
        }

        const query = querystring.stringify(params);

        return `${props.endpoint}/${encodeURIComponent(position)}${'' !== query ? ('?' + query) : ''}`
    }
}

module.exports = EmbedUrlFactory;
