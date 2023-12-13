import pkg from '../../package.json';
import { ClientVersion } from './client-version.mjs';
import { Client as StandardClient } from './standard/client.mjs';
import { Client as EmbedClient } from './embed/client.mjs';

const semver = pkg.version;

export class ClientFactory {
    static create(options = {}) {
        return new StandardClient(
            new ClientVersion(semver, `standard@${semver}`),
            options,
        );
    }

    static createEmbed(options = {}) {
        return new EmbedClient(
            new ClientVersion(semver, `embed@${semver}`),
            options,
        );
    }

    static get version() {
        return semver;
    }
}
