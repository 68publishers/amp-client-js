class AbstractGateway {
    constructor() {
        if (this.constructor === AbstractGateway) {
            throw new TypeError('Can not construct abstract class AbstractGateway.');
        }

        if (this.fetch === AbstractGateway.prototype.fetch) {
            throw new TypeError('Please implement abstract method ::fetch().');
        }
    }

    // eslint-disable-next-line no-unused-vars
    fetch(request, callback) {
        throw new TypeError('Do not call abstract method ::fetch() from child.');
    }
}

module.exports = AbstractGateway;
