let warned = false;

module.exports = (eventName, eventArgs) => {
    if (!('dataLayer' in window)) {
        !warned && console.warn('Unable to send metrics to GTM because the dataLayer does not occur in the window.');
        warned = true;

        return;
    }

    Object.keys(eventArgs).forEach((key) => (eventArgs[key] === null) && delete eventArgs[key]);

    window.dataLayer.push({
        event: eventName,
        ...eventArgs,
    });
};
