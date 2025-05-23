import merge from 'lodash/merge.js';
import templates from '../../template/index.mjs';

const roundRatio = (ratio, optionPath) => {
    const rounded = Math.round(ratio * 10) / 10;

    if (rounded !== ratio) {
        console.warn(`The value for the option "${optionPath}" has been rounded to ${rounded} (originally ${ratio}).`);
    }

    return rounded;
};

export function createConfig(options) {
    const config = merge({
        method: 'GET',
        url: null,
        version: 2,
        channel: null,
        locale: null,
        resources: {},
        origin: null,
        template: templates,
        interaction: {
            defaultIntersectionRatio: 0.5,
            intersectionRatioMap: {},
            firstTimeSeenTimeout: 1000,
        },
        metrics: {
            receiver: null,
            events: {},
            params: {},
            extraParams: {},
        },
        closing: {
            storage: 'localStorage',
            key: 'amp-closed-banners',
            maxItems: 500,
            external: {
                cookieName: 'amp-c',
                cookieDomain: null,
                cookiePath: '/',
                cookieExpire: 365, // days
            },
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
        throw new Error(`The option "version" must be a number, ${config.version} passed.`);
    }

    // channel
    if ('string' !== typeof config.channel) {
        throw new Error(`The option "channel" is required and must be a string, ${config.channel} passed.`);
    }

    // locale
    if (null !== config.locale && 'string' !== typeof config.locale) {
        throw new Error(`The option "locale" must be a string, ${config.locale} passed.`);
    }

    // resources
    if ('object' !== typeof config.resources) {
        throw new Error(`The option "resources" must be an object of that describes resources, ${config.resources} passed.`);
    }

    // origin
    if (null !== config.origin && 'string' !== typeof config.origin) {
        throw new Error(`The option "origin" must be a valid URL, ${config.origin} passed.`);
    }

    // template
    if ('object' !== typeof config.template) {
        throw new Error(`The option "template" must be an object of the format { single: string, random: string, multiple: string }, ${config.template} passed.`);
    }

    for (const [key, value] of Object.entries(config.template)) {
        if ('string' !== typeof value) {
            throw new Error(`The option "template.${key}" must be a string (lodash template), ${value} passed.`);
        }
    }

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
        throw new Error(`The option "metrics" must be an object of the format { receiver: null|string|function|array<string|function>, events: object, params: object }, ${config.metrics} passed.`);
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

    if ('object' !== typeof config.metrics.events) {
        throw new Error(`The option "metrics.event" must be an object of the format { *: string|false|{ name?: string, params?: { *: string }, extraParams?: { *: scalar } } }, ${JSON.stringify(config.metrics.events)} passed.`);
    }

    if ('object' !== typeof config.metrics.params) {
        throw new Error(`The option "metrics.params" must be an object of the format { *: string }, ${JSON.stringify(config.metrics.params)} passed.`);
    }

    if ('object' !== typeof config.metrics.extraParams) {
        throw new Error(`The option "metrics.extraParams" must be an object of the format { *: scalar }, ${JSON.stringify(config.metrics.params)} passed.`);
    }

    // closing
    if ('object' !== typeof config.closing || 'string' !== typeof config.closing.storage || 'string' !== typeof config.closing.key || !Number.isInteger(config.closing.maxItems) || 1 > config.closing.maxItems) {
        throw new Error(`The option "closing" must be an object of the format { storage?: "memoryStorage"|"localStorage"|"sessionStorage", key?: string, maxItems?: integer<1, max> }, ${JSON.stringify(config.closing)} passed.`);
    }

    if ('object' !== typeof config.closing.external
        || ('string' !== typeof config.closing.external.cookieName)
        || (null !== config.closing.external.cookieDomain && 'string' !== typeof config.closing.external.cookieDomain)
        || ('string' !== typeof config.closing.external.cookiePath)
        || ('number' !== typeof config.closing.external.cookieExpire || !Number.isInteger(config.closing.external.cookieExpire) || 1 > config.closing.external.cookieExpire)
    ) {
        throw new Error(`The option "closing.external" must be an object of the format { cookieName?: string, cookieDomain?: string|null, cookiePath?: string, cookieExpire?: integer<1, max> }, ${JSON.stringify(config.closing.external)} passed.`);
    }

    return config;
}
