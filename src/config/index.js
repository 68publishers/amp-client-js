'use strict';

(function (_) {

    module.exports = function config(options) {
        const defaults = {
            url: null,
            version: 1,
            channel: null,
            locale: null,
            resources: {},
            template: require('./template')
        };

        return _.merge(defaults, options);
    };

})(require('lodash'));
