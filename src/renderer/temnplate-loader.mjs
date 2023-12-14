import template from 'lodash/template.js';

export class TemplateLoader {
    #templates;
    #compiled;

    constructor (templates) {
        this.#templates = templates;
        this.#compiled = {};
    }

    getTemplate(displayType) {
        if (displayType in this.#compiled) {
            return this.#compiled[displayType];
        }

        if (!(displayType in this.#templates)) {
            throw new Error(`Template with type "${displayType}" not found.`);
        }

        return this.#compiled[displayType] = template(this.#templates[displayType]);
    }
}
