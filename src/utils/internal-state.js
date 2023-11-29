const properties = new WeakMap();

module.exports = (key) => {
    if (!properties.has(key)) {
        properties.set(key, {});
    }

    return properties.get(key);
};
