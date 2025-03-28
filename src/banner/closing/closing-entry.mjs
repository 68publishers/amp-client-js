export class ClosingEntry {
    constructor({ key, expiresAt, metadata = {} }) {
        /**
         * @type {EntryKey}
         */
        this.key = key;

        /**
         * @type {Number|Boolean} Integer or false
         */
        this.expiresAt = expiresAt;

        /**
         *
         * @type {Object}
         */
        this.metadata = metadata;
    }

    static position({ positionCode, closingExpiration, metadata = {} }) {
        if ('number' !== typeof closingExpiration) {
            throw new Error(`Unable to create position entry via factory ClosingEntry::position({ positionCode: ${positionCode}, closingExpiration: ${closingExpiration} }), argument "closingExpiration" must be a number.`);
        }

        return new ClosingEntry({
            key: EntryKey.position(positionCode),
            expiresAt: Math.round((+new Date() / 1000) + closingExpiration),
            metadata: metadata,
        });
    }

    static banner({ positionCode, bannerId, closingExpiration, metadata }) {
        return new ClosingEntry({
            key: EntryKey.banner(positionCode, bannerId),
            expiresAt: 'number' === typeof closingExpiration ? Math.round((+new Date() / 1000) + closingExpiration) : false,
            metadata: metadata,
        });
    }
}

export class EntryKey {
    constructor({ value, type, args }) {
        this.value = value;
        this.type = type;

        /**
         * @type {{positionCode: {String}, bannerId?: {String}}}
         */
        this.args = args;
    }

    static position(positionCode) {
        return new EntryKey({
            value: `p:${positionCode}`,
            type: 'position',
            args: {
                positionCode: positionCode,
            },
        });
    }

    static banner(positionCode, bannerId) {
        return new EntryKey({
            value: `b:${positionCode}:${bannerId}`,
            type: 'banner',
            args: {
                positionCode: positionCode,
                bannerId: bannerId,
            },
        });
    }

    static tryParse(keyNative) {
        const parts = keyNative.split(':');

        switch (true) {
            case 'p' === parts[0] && 2 === parts.length:
                return EntryKey.position(parts[1]);
            case 'b' === parts[0] && 3 === parts.length:
                return EntryKey.banner(parts[1], parts[2]);
        }

        return null;
    }

    isPosition() {
        return 'position' === this.type;
    }

    isBanner() {
        return 'banner' === this.type;
    }

    toString() {
        return this.value;
    }
}
