export class DimensionsProvider {
    #getWidthCallback;

    constructor(getWidthCallback) {
        this.#getWidthCallback = getWidthCallback;
    }

    static fromCurrentWindow() {
        return new DimensionsProvider(() => {
            return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        });
    }

    get width() {
        return (this.#getWidthCallback)();
    }
}
