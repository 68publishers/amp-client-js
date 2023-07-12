const _ = require('lodash');
const internal = require('../utils/internal-state')();

class TemplateLoader {
    constructor (templates) {
        internal(this).templates = templates;
        internal(this).compiled = {};
    }

    getTemplate(displayType) {
        const privateProperties = internal(this);

        if (privateProperties.compiled.hasOwnProperty(displayType)) {
            return privateProperties.compiled[displayType];
        }

        if (!privateProperties.templates.hasOwnProperty(displayType)) {
            throw new Error(`Template with type "${displayType}" not found.`);
        }

        return privateProperties.compiled[displayType] = _.template(privateProperties.templates[displayType]);
    }
}

class BannerRenderer {
    constructor (templates) {
        internal(this).loader = new TemplateLoader(templates);
    }

    render(banner) {
        banner.html = internal(this).loader.getTemplate(banner.data.displayType)({
            banner: banner,
            data: banner.data.bannerData
        });
    }
}

module.exports = BannerRenderer;
