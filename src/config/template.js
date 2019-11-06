'use strict';

(function () {

    const singleBannerContent = d => {
        return `
            <% if('img' === ${d}.content.type) { %>
                <a class="amp-banner__content amp-banner__content--img" href="<%- ${d}.content.href %>">
                    <img srcset="<%- ${d}.content.srcset %>" src="<%- ${d}.content.src %>" sizes="<%- ${d}.content.sizes %>" alt="<%- ${d}.content.alt %>" <% if('' !== ${d}.content.title) { print('title="' + ${d}.content.title + '"'); } %>>
                </a>
            <% } else if ('html' === ${d}.content.type) { %>
                <div class="amp-banner__content amp-banner__content--html">
                    <%= ${d}.content.content %>
                </div>
            <% } %>
        `;
    };

    /**
     * Arguments: ({Banner} banner, {Object} positionInfo, {Array[Object]|Object} data)
     *
     * - positionInfo contains keys `displayType` and `rotationSeconds`
     * - data contains single banner(s) data
     *
     */
    module.exports = {
        single: `<div class="amp-banner amp-banner--single">${singleBannerContent('data')}</div>`,
        random: `<div class="amp-banner amp-banner--random">${singleBannerContent('data')}</div>`,
        multiple: `
            <div class="amp-banner amp-banner--multiple">
                <ul class="amp-banner__list">
                    <% _.forEach(data, function(b) { %>
                        <li class="amp-banner__item">
                            ${singleBannerContent('b')}
                        </li>
                    <% }); %>
                </ul>
            </div>
        `
    }

})();
