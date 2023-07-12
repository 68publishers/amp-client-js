class State {
    static get NEW() {
        return 'NEW';
    }

    static get RENDERED() {
        return 'RENDERED';
    }

    static get NOT_FOUND() {
        return 'NOT_FOUND';
    }

    static get ERROR() {
        return 'ERROR';
    }

    static get STATES() {
        return [
            State.NEW,
            State.RENDERED,
            State.NOT_FOUND,
            State.ERROR,
        ];
    }
}

module.exports = State;
