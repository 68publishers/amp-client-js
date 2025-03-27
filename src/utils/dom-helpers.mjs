/**
 *
 * @param {string|HTMLElement} el
 * @param {Window} refWindow
 * @returns {HTMLElement}
 */
export function getHtmlElement(el, refWindow) {
    if (el instanceof refWindow.HTMLElement) {
        return el;
    }

    if (typeof el !== 'string') {
        throw new TypeError('Element must be instance of HTMLElement or String');
    }

    let htmlEl;

    if ('#' === el.charAt(0)) {
        htmlEl = document.getElementById(el.slice(1));
    } else {
        htmlEl = document.querySelector(el);
    }

    if (!(htmlEl instanceof refWindow.HTMLElement)) {
        throw new TypeError('Selector ' + el + ' is invalid.');
    }

    return htmlEl;
}

/**
 *
 * @param {HTMLElement} el
 * @returns {void}
 */
export function evalScripts(el) {
    Array.from(el.getElementsByTagName('script'))
        .forEach( script => {
            if ('' !== script.type && 'text/javascript' !== script.type) {
                return;
            }

            const newScript = document.createElement('script');

            Array.from(script.attributes).forEach( attr => {
                newScript.setAttribute(attr.name, attr.value)
            });

            newScript.appendChild(document.createTextNode(script.innerHTML));
            script.parentNode.replaceChild(newScript, script);
        });
}
