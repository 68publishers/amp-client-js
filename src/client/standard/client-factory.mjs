import pkg from '../../../package.json';
import { ClientVersion } from '../client-version.mjs';
import { Client } from './client.mjs';

const semver = pkg.version;

export class ClientFactory {
    static create(options = {}) {
        return new Client(
            ClientFactory.version,
            options,
        );
    }

    static get version() {
        return new ClientVersion(semver, `standard@${semver}`);
    }
}
