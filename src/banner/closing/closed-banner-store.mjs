import { EntryKey } from './closing-entry.mjs';

export class ClosedBannerStore {
    #storage;
    #key;
    #maxItems;
    #loadedItems = null;
    #revision = 0;

    /**
     * @type {{
     *     cookieName: string,
     *     cookieDomain: string|null,
     *     cookiePath: string,
     *     cookieExpire: number,
     * }|null}
     */
    #externalOptions = null;

    constructor({
        storage,
        key,
        maxItems,
        externalOptions,
        onStorageChange,
    }) {
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

        if ('cookieName' in externalOptions && externalOptions.cookieName) {
            this.#externalOptions = {
                cookieName: externalOptions.cookieName,
                cookieDomain: externalOptions.cookieDomain || null,
                cookiePath: externalOptions.cookiePath || '/',
                cookieExpire: externalOptions.cookieExpire || 1,
            }
        }

        if (onStorageChange && this.#storage instanceof Storage) {
            window.addEventListener('storage', event => {
                if (!(null === event.key || this.#key === event.key)) {
                    return;
                }

                const currentItems = this.#loadedItems || {
                    r: this.#revision,
                };
                let newItems;

                try {
                    newItems = null !== event.newValue && '' !== event.newValue ? JSON.parse(event.newValue) : {};
                } catch (e) {
                    console.warn('Failed to parse storage data as JSON, skipping closed items synchronization.', e);
                    return;
                }

                if ('r' in newItems && newItems.r !== currentItems.r) {
                    this.setRevision(newItems.r);
                }

                const currentKeys = Object.keys(currentItems);
                const diffKeys = Object.keys(newItems)
                    .filter(key => 'r' !== key && !currentKeys.includes(key))
                    .map(key => EntryKey.tryParse(key))
                    .filter(key => null !== key);

                this.#loadedItems = newItems;

                if (0 < diffKeys.length) {
                    onStorageChange(diffKeys);
                }
            });
        }
    }

    setRevision(revision) {
        if ('number' === typeof revision && Number.isInteger(revision)) {
            this.#revision = revision;
            this.#loadedItems = null;
        }
    }

    close(entries) {
        const now = this.#getNow();

        let items = null;
        const changedKeys = [];

        let cookieItems = null;
        const cookieChangedKeys = [];

        for (let i in entries) {
            const entry = entries[i];

            if (false !== entry.expiresAt && entry.expiresAt <= now) {
                continue;
            }

            const key = entry.key.toString();

            if (null === items) {
                items = this.#getItems();
            }

            if (!(key in items) || items[key] !== entry.expiresAt) {
                items[key] = entry.expiresAt;
                changedKeys.push(key);
            }

            if (null !== this.#externalOptions && 'external' in entry.metadata && true === entry.metadata.external) {
                cookieItems = null !== cookieItems ? cookieItems : this.#loadCookieItems();

                if (!(key in cookieItems) || cookieItems[key] !== entry.expiresAt) {
                    cookieItems[key] = entry.expiresAt;
                    cookieChangedKeys.push(key);
                }
            }
        }

        if (0 < changedKeys.length) {
            const length = Object.values(items || {}).length;

            if (length > this.#maxItems) {
                Object.entries(items)
                    .filter(e => 'r' !== e[0] && -1 === changedKeys.indexOf(e[0]))
                    .sort((a, b) => (a[1] || Number.MAX_SAFE_INTEGER) - (b[1] || Number.MAX_SAFE_INTEGER))
                    .slice(0, length - this.#maxItems)
                    .forEach(item => {
                        delete items[item[0]];
                    });
            }

            this.#loadedItems = items;
            this.#flush();
        }

        if (0 < cookieChangedKeys.length) {
            let cookieFlushed = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 10;

            do {
                cookieFlushed = this.#flushCookie(cookieItems);

                if (!cookieFlushed) {
                    if (attempts >= MAX_ATTEMPTS) {
                        console.warn('Failed to flush cookie after multiple attempts, discarding remaining items.');
                        break;
                    }

                    Object.entries(cookieItems)
                        .filter(e => 'r' !== e[0] && -1 === cookieChangedKeys.indexOf(e[0]))
                        .sort((a, b) => (a[1] || Number.MAX_SAFE_INTEGER) - (b[1] || Number.MAX_SAFE_INTEGER))
                        .slice(0, Object.values(cookieItems || {}).length - 1)
                        .forEach(item => {
                            delete cookieItems[item[0]];
                        });

                    attempts++;
                }
            } while (!cookieFlushed);
        }
    }

    release(keys, { includeExternal = false }) {
        const items = this.#getItems();
        const cookieItems = includeExternal && null !== this.#externalOptions ? this.#loadCookieItems() : null;

        let changed = false;
        let cookieChanged = false;

        for (let i in keys) {
            const key = keys[i];
            const keyNative = key.toString();

            if (keyNative in items) {
                delete items[keyNative];
                changed = true;
            }

            if (null !== cookieItems && keyNative in cookieItems) {
                delete cookieItems[keyNative];
                cookieChanged = true;
            }
        }

        if (changed) {
            this.#loadedItems = items;
            this.#flush();
        }

        if (cookieChanged) {
            this.#flushCookie(cookieItems);
        }
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

        setTimeout(() => this.release([key], { includeExternal: false }), 0);

        return false;
    }

    #getItems() {
        if (null !== this.#loadedItems) {
            if (this.#revision === this.#loadedItems.r) {
                return this.#loadedItems;
            }

            this.#loadedItems = null;
        }

        const storedValue = this.#storage.getItem(this.#key);
        let listOfItems;

        try {
            listOfItems = null !== storedValue && '' !== storedValue ? JSON.parse(storedValue) : {
                r: this.#revision,
            };
        } catch (e) {
            listOfItems = {};
        }

        if ('object' !== typeof listOfItems || Array.isArray(listOfItems) || listOfItems.r !== this.#revision) { // flush invalid state
            listOfItems = {
                r: this.#revision,
            };
            this.#storage.removeItem(this.#key);
        }

        return this.#loadedItems = listOfItems;
    }

    #loadCookieItems() {
        if (null === this.#externalOptions) {
            return {
                r: this.#revision,
            };
        }

        const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(this.#externalOptions.cookieName + '='));

        if (!cookie) {
            return {
                r: this.#revision,
            };
        }

        let listOfItems;

        try {
            listOfItems = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        } catch (e) {
            listOfItems = {};
        }

        if ('object' !== typeof listOfItems || Array.isArray(listOfItems) || listOfItems.r !== this.#revision) { // flush invalid state
            listOfItems = {
                r: this.#revision,
            };
            this.#flushCookie({});
        }

        return listOfItems;
    }

    #flush() {
        if (null !== this.#loadedItems) {
            const length = Object.keys(this.#loadedItems).length;

            if (0 >= length || ('r' in this.#loadedItems && 1 === length)) {
                this.#storage.removeItem(this.#key);
            } else {
                this.#storage.setItem(this.#key, JSON.stringify(this.#loadedItems));
            }
        }
    }

    #flushCookie(items) {
        if (null === this.#externalOptions) {
            return false;
        }

        const length = Object.keys(items).length;
        let expires;

        if (0 >= length || ('r' in this.#loadedItems && 1 === length)) {
            expires = 'Thu, 01 Jan 1970 00:00:01 GMT';
        } else {
            const date = new Date();
            date.setTime(date.getTime() + (1000 * (this.#externalOptions.cookieExpire * 24 * 60 * 60)));

            expires = date.toUTCString();
        }

        let cookieValue = `${this.#externalOptions.cookieName}=${encodeURIComponent(JSON.stringify(items))}; path=${this.#externalOptions.cookiePath}; expires=${expires}; samesite=Lax`;

        if (this.#externalOptions.cookieDomain) {
            cookieValue += `; domain=${this.#externalOptions.cookieDomain}`;
        }

        if ('https:' === window.location.protocol) {
            cookieValue += `; secure`;
        }

        if (cookieValue.length > 4096) { // 4kb
            return false;
        }

        document.cookie = cookieValue;

        return true;
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
        const removeItem = function (key) {
            key in this.items && (delete this.items[key]);
        };

        storage.setItem = setItem.bind(storage);
        storage.getItem = getItem.bind(storage);
        storage.removeItem = removeItem.bind(storage);

        return storage;
    }

    #getNow() {
        return Math.round((+new Date() / 1000));
    }
}
