export class SequenceGenerator {
    #lastId;

    constructor (start = 1) {
        this.#lastId = start -1;
    }

    getNextIdentifier() {
        return ++this.#lastId;
    }
}
