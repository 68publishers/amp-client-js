export class DimensionsProvider {
    #getWidthCallback;

    constructor(getWidthCallback) {
        this.#getWidthCallback = getWidthCallback;
    }

    static fromCurrentWindow() {
        return new DimensionsProvider(() => {
            return document.documentElement.clientWidth || document.body.clientWidth;
        });
    }

    get width() {
        return (this.#getWidthCallback)();
    }
}
