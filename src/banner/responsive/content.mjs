export class Content {
    #breakpoint;
    #data;

    constructor(breakpoint, data) {
        this.#breakpoint = breakpoint;
        this.#data = data;
    }

    get breakpoint() {
        return this.#breakpoint;
    }

    get data() {
        return this.#data;
    }
}
