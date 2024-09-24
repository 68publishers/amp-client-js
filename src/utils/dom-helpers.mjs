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
