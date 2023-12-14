export class Resource {
    #name;
    #value;

    constructor(name, value) {
        this.#name = name;
        this.#value = this.#getValueArray(value);
    }

    get name() {
        return this.#name;
    }

    get value() {
        return this.#value;
    }

    withValues(value) {
        return new Resource(this.name, this.#getValueArray(value).concat(this.value).filter((value, index, array) => {
            return array.indexOf(value) === index;
        }));
    }

    #getValueArray(value) {
        return Array.isArray(value) ? value : [ value ];
    }
}
