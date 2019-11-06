'use strict';

(function (_) {

    function getValueArray(value) {
        return _.isArray(value) ? value : [ value ];
    }

    class Resource {
        constructor(name, value) {
            value = getValueArray(value);

            this.name = name;
            this.value = value;
        }

        withValues (value) {
            return new Resource(name, _.union(getValueArray(value), this.value));
        }
    }

    module.exports = Resource;

})(require('lodash'));
