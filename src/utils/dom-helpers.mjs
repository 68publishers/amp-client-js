export function getHtmlElement(el) {
    if (el instanceof HTMLElement) {
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

    if (!(htmlEl instanceof HTMLElement)) {
        throw new TypeError('Selector ' + el + ' is invalid.');
    }

    return htmlEl;
}
