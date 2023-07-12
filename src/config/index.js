'use strict';

(function (_) {

    module.exports = function config(options) {
        const defaults = {
            method: 'GET',
            url: null,
            version: 1,
            channel: null,
            locale: null,
            resources: {},
            template: require('./template'),
            interaction: {
                intersectionThreshold: 0.5,
                firstSeenTimeout: 1000,
            },
            metrics: {
                receiver: null,
                disabledEvents: [],
            }
        };

        return _.merge(defaults, options);
    };

})(require('lodash'));
