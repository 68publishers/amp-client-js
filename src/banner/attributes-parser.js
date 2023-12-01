class AttributesParser {
    static parseResources(element) {
        const resources = {};

        const attributes = [].filter.call(element.attributes, attr => {
            return /^data-amp-resource-\S+/.test(attr.name);
        });

        for (let attr of attributes) {
            if (attr.value) {
                resources[attr.name.slice(18)] = attr.value.split(',').map(v => v.trim());
            }
        }

        return resources;
    }

    static parseOptions(element) {
        const options = {};

        const attributes = [].filter.call(element.attributes, attr => {
            return /^data-amp-option-\S+/.test(attr.name);
        });

        for (let opt of attributes) {
            if (opt.value) {
                options[opt.name.slice(16)] = opt.value.trim();
            }
        }

        return options;
    }
}

module.exports = AttributesParser;
