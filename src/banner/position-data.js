class PositionData {
    /**
     * @param {string|null} id
     * @param {string} code
     * @param {string|null} name
     * @param {int} rotationSeconds
     * @param {string|null} displayType
     * @param {string|null} breakpointType
     */
    constructor({ id, code, name, rotationSeconds, displayType, breakpointType }) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.rotationSeconds = rotationSeconds;
        this.displayType = displayType;
        this.breakpointType = breakpointType;
    }

    static createInitial(code) {
        return new PositionData({
            id: null,
            code,
            name: null,
            rotationSeconds: 0,
            displayType: null,
            breakpointType: null,
        });
    }

    isSingle() {
        return 'single' === this.displayType;
    }

    isRandom() {
        return 'random' === this.displayType;
    }

    isMultiple() {
        return 'multiple' === this.displayType;
    }
}

module.exports = PositionData;
