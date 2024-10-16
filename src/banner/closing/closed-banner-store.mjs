import { EntryKey } from './closing-entry.mjs';

export class ClosedBannerStore {
    #storage;
    #key;
    #maxItems;
    #loadedItems = null;

    constructor({ storage, key, maxItems, onExternalChange }) {
        switch (storage) {
            case 'localStorage':
                if (!('localStorage' in window)) {
                    console.warn('LocalStorage is not accessible in the window, fallback to memoryStorage.');
                    storage = this.#createMemoryStorage();
                } else {
                    storage = window.localStorage;
                }
                break;
            case 'sessionStorage':
                if (!('sessionStorage' in window)) {
                    console.warn('SessionStorage is not accessible in the window, fallback to memoryStorage.');
                    storage = this.#createMemoryStorage();
                } else {
                    storage = window.sessionStorage;
                }
                break;
            default:
                if ('memoryStorage' !== storage) {
                    console.warn(`Unknown storage "${storage}", fallback to memoryStorage.`);
                }
                storage = this.#createMemoryStorage();
                break;
        }

        this.#storage = storage;
        this.#key = key;
        this.#maxItems = maxItems;

        if (onExternalChange && this.#storage instanceof Storage) {
            window.addEventListener('storage', event => {
                if (!(null === event.key || this.#key === event.key)) {
                    return;
                }

                const currentItems = this.#loadedItems || {};
                const newItems = null !== event.newValue && '' !== event.newValue ? JSON.parse(event.newValue) : {};

                const currentKeys = Object.keys(currentItems);
                const diffKeys = Object.keys(newItems)
                    .filter(key => !currentKeys.includes(key))
                    .map(key => EntryKey.tryParse(key))
                    .filter(key => null !== key);

                this.#loadedItems = newItems;

                if (0 < diffKeys.length) {
                    onExternalChange(diffKeys);
                }
            });
        }
    }

    close(entries) {
        const items = this.#getItems();
        const now = this.#getNow();
        let changed = false;

        for (let i in entries) {
            const entry = entries[i];

            if (false !== entry.expiresAt && entry.expiresAt <= now) {
                continue;
            }

            const key = entry.key.toString();

            if (!(key in items) || items[key] !== entry.expiresAt) {
                items[key] = entry.expiresAt;
                changed = true;
            }
        }

        if (!changed) {
            return;
        }

        const length = Object.values(items).length;

        if (length > this.#maxItems) {
            Object.entries(items)
                .sort((a, b) => (a[1] || Number.MAX_SAFE_INTEGER) - (b[1] || Number.MAX_SAFE_INTEGER))
                .slice(0, length - this.#maxItems)
                .forEach(item => {
                    delete items[item[0]];
                })
        }

        this.#loadedItems = items;
        this.#flush();
    }

    release(keys) {
        const items = this.#getItems();
        let changed = false;

        for (let i in keys) {
            const key = keys[i];
            const keyNative = key.toString();

            if (keyNative in items) {
                delete items[keyNative];
                changed = true;
            }
        }

        if (!changed) {
            return;
        }

        this.#loadedItems = items;
        this.#flush();
    }

    isClosed(key) {
        const items = this.#getItems();
        const keyNative = key.toString();

        if (!(keyNative in items)) {
            return false;
        }

        if (false === items[keyNative] || items[keyNative] > this.#getNow()) {
            return true;
        }

        setTimeout(() => this.release([key]), 0);

        return false;
    }

    #getItems() {
        if (null !== this.#loadedItems) {
            return this.#loadedItems;
        }

        const storedValue = this.#storage.getItem(this.#key);
        let listOfItems = null !== storedValue && '' !== storedValue ? JSON.parse(storedValue) : {};

        if (Array.isArray(listOfItems)) { // back compatibility - flush already persisted item
            listOfItems = {};
            this.#storage.setItem(this.#key, '{}');
        }

        return this.#loadedItems = listOfItems;
    }

    #flush() {
        if (null !== this.#loadedItems) {
            this.#storage.setItem(this.#key, JSON.stringify(this.#loadedItems));
        }
    }

    #createMemoryStorage() {
        const storage = {
            items: {},
        };
        const setItem = function (key, value) {
            this.items[key] = value;
        };
        const getItem = function (key) {
            return key in this.items ? this.items[key] : null;
        };

        storage.setItem = setItem.bind(storage);
        storage.getItem = getItem.bind(storage);

        return storage;
    }

    #getNow() {
        return Math.round((+new Date() / 1000));
    }
}
