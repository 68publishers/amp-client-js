const semver = require('../../../package.json').version;
const ClientVersion = require('../client-version');
const Client = require('./client');

class ClientFactory {
    static create(options = {}) {
        return new Client(
            ClientFactory.version,
            options,
        );
    }

    static get version() {
        return new ClientVersion(semver, `embed@${semver}`);
    }
}

module.exports = ClientFactory;
