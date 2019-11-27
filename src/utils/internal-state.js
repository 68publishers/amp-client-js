'use strict';

(function () {

    module.exports = function () {
        const properties = new WeakMap();

        return (key) => {
            if (!properties.has(key)) {
                properties.set(key, {});
            }

            return properties.get(key);
        };
    };

})();
