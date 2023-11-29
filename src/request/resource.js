const internal = require('../utils/internal-state');

function getValueArray(value) {
    return Array.isArray(value) ? value : [ value ];
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
        return new Resource(this.name, getValueArray(value).concat(this.value).filter((value, index, array) => {
            return array.indexOf(value) === index;
        }));
    }
}

module.exports = Resource;
