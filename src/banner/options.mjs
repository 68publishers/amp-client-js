export class Options {
    constructor(options) {
        this.options = options;
    }

    has(optionName) {
        return undefined !== this.options[optionName];
    }

    get(optionName, defaultValue = undefined) {
        return this.options[optionName] || defaultValue;
    }

    merge(options) {
        this.options = {...this.options, ...options};
    }
}
