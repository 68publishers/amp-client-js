(function (_, Randomizer) {

    class TemplateLoader {

        constructor (templates) {
            this._templates = templates;
            this._compiled = {};
        }

        getTemplate(displayType) {
            if (this._compiled.hasOwnProperty(displayType)) {
                return this._compiled[displayType];
            }

            if (!this._templates.hasOwnProperty(displayType)) {
                throw new Error(`Template with type "${displayType}" not found.`);
            }

            return this._compiled[displayType] = _.template(this._templates[displayType]);
        }
    }

    class BannerRenderer {

        constructor (templates) {
            this._loader = new TemplateLoader(templates);
        }

        render(banner, positionInfo, data) {
            if ('single' === positionInfo.displayType) {
                data = _.maxBy(data, 'score');
            }

            if ('random' === positionInfo.displayType) {
                data = Randomizer.randomByWeights(data, 'score');
            }

            if ('multiple' === positionInfo.displayType) {
                data = _.orderBy(data, ['score'], ['desc']);
            }

            if (_.isEmpty(data)) {
                throw new Error('Banner\'s data is empty.');
            }

            const html = this._loader.getTemplate(positionInfo.displayType)({
                banner: banner,
                positionInfo: positionInfo,
                data: data
            });

            banner.setHtml(html);
        }
    }

    module.exports = BannerRenderer;

})(require('lodash'), require('../utils/randomizer'));
