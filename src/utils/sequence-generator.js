'use strict';

(function () {

    class SequenceGenerator {

        constructor (start = 1) {
            this._lastId = start - 1;
        }

        getNextIdentifier() {
            return this._lastId++;
        }
    }

    module.exports = SequenceGenerator;

})();
