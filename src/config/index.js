const merge = require('lodash/merge');

const roundRatio = (ratio, optionPath) => {
    const rounded = Math.round(ratio * 10) / 10;

    if (rounded !== ratio) {
        console.warn(`The value for the option "${optionPath}" has been rounded to ${rounded} (originally ${ratio}).`);
    }

    return rounded;
};

module.exports = options => {
    const config = merge({
        method: 'GET',
        url: null,
        version: 1,
        channel: null,
        locale: null,
        resources: {},
        template: require('./template'),
        interaction: {
            defaultIntersectionRatio: 0.5,
            intersectionRatioMap: {},
            firstTimeSeenTimeout: 1000,
        },
        metrics: {
            receiver: null,
            disabledEvents: [],
        },
    }, options);

    // method
    if ('string' !== typeof config.method || !(config.method.toUpperCase() in {GET: 1, POST: 1})) {
        throw new Error(`The option "method" must be one of these ["GET", "POST"], ${config.method} passed.`);
    }

    config.method = config.method.toUpperCase();

    // url
    if ('string' !== typeof config.url) {
        throw new Error(`The option "url" is required and must be a valid URL, ${config.url} passed.`);
    }

    // version
    if ('number' !== typeof config.version) {
        throw new Error(`The option "version" contains be a number, ${config.version} passed.`);
    }

    // channel
    if ('string' !== typeof config.channel) {
        throw new Error(`The option "channel" is required and must be a string, ${config.channel} passed.`);
    }

    // locale
    if (null !== config.locale && 'string' !== typeof config.locale) {
        throw new Error(`The option "version" contains be a number, ${config.version} passed.`);
    }

    // resources
    if ('object' !== typeof config.resources) {
        throw new Error(`The option "resources" must be an object of that describes resources, ${config.resources} passed.`);
    }

    // template
    if ('object' !== typeof config.template) {
        throw new Error(`The option "template" must be an object with the shape { single: string, random: string, multiple: string }, ${config.template} passed.`);
    }

    for (const [key, value] of Object.entries(config.template)) {
        if ('string' !== typeof value) {
            throw new Error(`The option "template.${key}" must be a string (lodash template), ${value} passed.`);
        }
    }

    // interaction
    if ('object' !== typeof config.interaction) {
        throw new Error(`The option "interaction" must be an object with the shape { intersectionRatio: int|float, firstTimeSeenTimeout: int }, ${config.interaction} passed.`);
    }

    if ('number' !== typeof config.interaction.defaultIntersectionRatio || 0.1 > config.interaction.defaultIntersectionRatio || 1 < config.interaction.defaultIntersectionRatio) {
        throw new Error(`The option "interaction.defaultIntersectionRatio" must be a number between 0.1 and 1 in increments of 0.1 [e.g. 0.1, 0.2, 0.3, ...], "${config.interaction.defaultIntersectionRatio}" passed.`);
    }

    config.interaction.defaultIntersectionRatio = roundRatio(config.interaction.defaultIntersectionRatio, 'interaction.defaultIntersectionRatio');

    if ('object' !== typeof config.interaction.intersectionRatioMap) {
        throw new Error(`The option "interaction.intersectionRatioMap" must be an object with an integer keys (pixels) and valid ratios as values, ${config.interaction.intersectionRatioMap} passed.`);
    }

    for (const [key, value] of Object.entries(config.interaction.intersectionRatioMap)) {
        if (Number(key).toString() !== key) {
            throw new Error(`The key "interaction.intersectionRatioMap.${key}" must be an integer.`);
        }

        if ('number' !== typeof value || 0.1 > value || 1 < value) {
            throw new Error(`The option "interaction.intersectionRatioMap.${key}" must be a number between 0.1 and 1 in increments of 0.1 [e.g. 0.1, 0.2, 0.3, ...], "${config.interaction.intersectionRatioMap[key]}" passed.`);
        }

        config.interaction.intersectionRatioMap[key] = roundRatio(value, 'interaction.intersectionRatioMap.' + key);
    }

    if (!Number.isInteger(config.interaction.firstTimeSeenTimeout) || 500 > config.interaction.firstTimeSeenTimeout) {
        throw new Error(`The option "interaction.firstTimeSeenTimeout" must be a int with a minimum value of 500, "${config.interaction.firstTimeSeenTimeout}" passed.`);
    }

    // metrics
    if ('object' !== typeof config.metrics) {
        throw new Error(`The option "metrics" must be an object with the shape { receiver: null|string|function|array<string|function>, disabledEvents: array<string> }, ${config.metrics} passed.`);
    }

    if (null !== config.metrics.receiver && -1 === ['string', 'function'].indexOf(typeof config.metrics.receiver) && !Array.isArray(config.metrics.receiver)) {
        throw new Error(`The option "metrics.receiver" must be a null or a string or a function or an array of strings|functions, "${config.metrics.receiver}" passed.`);
    }

    if (Array.isArray(config.metrics.receiver)) {
        for (let receiverIndex in config.metrics.receiver) {
            if (-1 === ['string', 'function'].indexOf(typeof config.metrics.receiver[receiverIndex])) {
                throw new Error(`The option "metrics.receiver.${receiverIndex}" must be a string or a function, "${config.metrics.receiver[receiverIndex]}" passed.`);
            }
        }
    } else {
        config.metrics.receiver = null !== config.metrics.receiver ? [config.metrics.receiver] : [];
    }

    if (!Array.isArray(config.metrics.disabledEvents)) {
        throw new Error(`The option "metrics.disabledEvents" must an array of strings (event names), "${config.metrics.disabledEvents}" passed.`);
    }

    for (let disabledEventIndex in config.metrics.disabledEvents) {
        if ('string' !== typeof config.metrics.disabledEvents[disabledEventIndex]) {
            throw new Error(`The option "metrics.disabledEvents.${disabledEventIndex}" must be a string, "${config.metrics.disabledEvents[disabledEventIndex]}" passed.`);
        }
    }

    return config;
};
