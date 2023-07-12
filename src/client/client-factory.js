const Client = require('./client');

class ClientFactory {
    static create(options = {}) {
        return new Client(options);
    }
}

module.exports = ClientFactory;
