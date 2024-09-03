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

                const currentItems = this.#loadedItems || [];
                const newItems = null !== event.newValue && '' !== event.newValue ? event.newValue.split(',') : [];
                const diff = newItems.filter(id => !currentItems.includes(id));

                this.#loadedItems = newItems;

                if (0 < diff.length) {
                    onExternalChange(diff);
                }
            });
        }
    }

    persist(bannerId, closed) {
        const items = this.#getItems();
        const index = items.indexOf(bannerId);
        let changed = false;

        if (closed && -1 === index) {
            items.push(bannerId);
            changed = true;
        } else if (!closed && -1 !== index) {
            items.splice(index, 1);
            changed = true;
        }

        if (!changed) {
            return;
        }

        if (items.length > this.#maxItems) {
            items.splice(items.length - this.#maxItems);
        }

        this.#loadedItems = items;
        this.#flush();
    }

    isClosed(bannerId) {
        return -1 !== this.#getItems().indexOf(bannerId);
    }

    #getItems() {
        if (null !== this.#loadedItems) {
            return this.#loadedItems;
        }

        const storedValue = this.#storage.getItem(this.#key);
        const listOfItems = null !== storedValue && '' !== storedValue ? storedValue.split(',') : [];

        return this.#loadedItems = listOfItems;
    }

    #flush() {
        if (null !== this.#loadedItems) {
            this.#storage.setItem(this.#key, this.#loadedItems.join(','));
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
}
