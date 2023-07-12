const _ = require('lodash');
const internal = require('../utils/internal-state')()

function getValueArray(value) {
    return _.isArray(value) ? value : [ value ];
}

class Resource {
    constructor(name, value) {
        internal(this).name = name;
        internal(this).value = getValueArray(value);
    }

    get name() {
        return internal(this).name;
    }

    get value() {
        return internal(this).value;
    }

    withValues(value) {
        return new Resource(this.name, _.union(getValueArray(value), this.value));
    }
}

module.exports = Resource;
