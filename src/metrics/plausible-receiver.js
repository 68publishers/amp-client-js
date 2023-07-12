let warned = false;

module.exports = (eventName, eventArgs) => {
    if (!('plausible' in window) || 'function' !== typeof window.plausible) {
        !warned && console.warn('Unable to send metrics to Plausible because the function plausible() does not occur in the window.');
        warned = true;

        return;
    }

    Object.keys(eventArgs).forEach((key) => (eventArgs[key] === null) && delete eventArgs[key]);

    window.plausible(eventName, {
        props: eventArgs,
    });
};
