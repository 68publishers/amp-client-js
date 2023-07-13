const merge = require('lodash/merge');

module.exports = options => {
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
        },
    };

    return merge(defaults, options);
};
