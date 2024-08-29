import { evaluateExpression } from '../utils/expression.mjs';

export class Options {
    constructor(options) {
        this.options = {};
        this.options = this.#fixOptionsCompatibility({...options});
    }

    has(optionName) {
        return undefined !== this.options[optionName];
    }

    get(optionName, defaultValue = undefined) {
        return this.options[optionName] || defaultValue;
    }

    evaluate(optionName, index) {
        if (undefined === this.options[optionName]) {
            return null;
        }

        return evaluateExpression(
            this.options[optionName],
            index
        );
    }

    override(options) {
        this.options = {
            ...this.options,
            ...this.#fixOptionsCompatibility({...options}),
        };
    }

    #fixOptionsCompatibility(options) {
        if ('loading-offset' in options) {
            const offset = options['loading-offset'];
            const loading = 'loading' in options ? options['loading'] : ('loading' in this.options ? this.options['loading'] : null);
            const loadingExpression = null !== loading ? `>=${offset}:${loading}` : null;
            let message = `AMP deprecation warning: The banner option "loading-offset" is deprecated and will be removed in some future release.`;

            if (null !== loadingExpression) {
                message += ` Instead of options {"loading": "${loading}", "loading-offset": "${offset}"} use an expression based option {"loading": "${loadingExpression}"}.`;
            }

            console.warn(message);

            delete options['loading-offset'];
            null !== loadingExpression && (options.loading = loadingExpression);
        }

        return options;
    }
}
