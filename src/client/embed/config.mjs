import merge from 'lodash/merge.js';

const roundRatio = (ratio, optionPath) => {
    const rounded = Math.round(ratio * 10) / 10;

    if (rounded !== ratio) {
        console.warn(`The value for the option "${optionPath}" has been rounded to ${rounded} (originally ${ratio}).`);
    }

    return rounded;
};

export function createMainConfig(options) {
    return merge({
        channel: null,
    }, options);
}

export function createExtendedConfig(options) {
    const config = merge({
        interaction: {
            defaultIntersectionRatio: 0.5,
            intersectionRatioMap: {},
            firstTimeSeenTimeout: 1000,
        },
        metrics: {
            events: {},
            params: {},
        },
    }, options);

    // interaction
    if ('object' !== typeof config.interaction) {
        throw new Error(`The option "interaction" must be an object of the format { intersectionRatio: int|float, firstTimeSeenTimeout: int }, ${config.interaction} passed.`);
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
        throw new Error(`The option "metrics" must be an object of the format { events: object{ *: string|false }, params: object{ *: string } }, ${JSON.stringify(config.metrics)} passed.`);
    }

    if ('object' !== typeof config.metrics.events) {
        throw new Error(`The option "metrics.event" must be an object of the format { *: string|false }, ${JSON.stringify(config.metrics.events)} passed.`);
    }

    if ('object' !== typeof config.metrics.params) {
        throw new Error(`The option "metrics.params" must be an object of the format { *: string }, ${JSON.stringify(config.metrics.params)} passed.`);
    }

    return config;
}
