'use strict';

(function (internal) {

    class SequenceGenerator {

        constructor (start = 1) {
            internal(this).lastId = start -1;
        }

        getNextIdentifier() {
            return internal(this).lastId++;
        }
    }

    module.exports = SequenceGenerator;

})(require('./internal-state')());
