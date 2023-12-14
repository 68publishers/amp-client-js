export class ClientVersion {
    #semver;
    #full;

    constructor(semver, full) {
        this.#semver = semver;
        this.#full = full;
    }

    get semver() {
        return this.#semver;
    }

    get full() {
        return this.#full;
    }
}
