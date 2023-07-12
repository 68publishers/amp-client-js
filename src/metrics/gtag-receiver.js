let warned = false;

module.exports = (eventName, eventArgs) => {
    if (!('gtag' in window) || 'function' !== typeof window.gtag) {
        !warned && console.warn('Unable to send metrics to Google Analytics because the function gtag() does not occur in the window.');
        warned = true;

        return;
    }

    Object.keys(eventArgs).forEach((key) => (eventArgs[key] === null) && delete eventArgs[key]);

    window.gtag('event', eventName, eventArgs);
};
