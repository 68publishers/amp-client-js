const singleBannerContent = d => {
    return `
        <% if('img' === ${d}.content.type) { %>
            <a class="amp-banner__content amp-banner__content--img" href="<%= ${d}.content.href %>" <% if(null !== ${d}.content.target) { print('target="' + ${d}.content.target + '"'); } %>>
                <picture>
                    <% (${d}.content.sources || []).forEach(function(source) { %>
                        <source type="<%= source.type %>" srcset="<%= source.srcset %>" sizes="<%- ${d}.content.sizes %>">
                    <% }); %>
                    <img srcset="<%= ${d}.content.srcset %>" src="<%= ${d}.content.src %>" sizes="<%- ${d}.content.sizes %>" alt="<%- ${d}.content.alt %>" <% if('' !== ${d}.content.title) { print('title="' + ${d}.content.title + '"'); } %>>
                </picture>
            </a>
        <% } else if ('html' === ${d}.content.type) { %>
            <div class="amp-banner__content amp-banner__content--html">
                <%= ${d}.content.html %>
            </div>
        <% } %>
    `;
};

/**
 * Arguments: ({Banner} banner, {Array[Object]|Object} data)
 *
 * - data contains single banner(s) data
 */
module.exports = {
    single: `<div class="amp-banner amp-banner--single" data-amp-banner-fingerprint="<%= data.fingerprint %>">${singleBannerContent('data')}</div>`,
    random: `<div class="amp-banner amp-banner--random" data-amp-banner-fingerprint="<%= data.fingerprint %>">${singleBannerContent('data')}</div>`,
    multiple: `
        <div class="amp-banner amp-banner--multiple">
            <div class="amp-banner__list">
                <% data.forEach(function(b) { %>
                    <div class="amp-banner__item" data-amp-banner-fingerprint="<%= b.fingerprint %>">
                        ${singleBannerContent('b')}
                    </div>
                <% }); %>
            </div>
        </div>
    `,
}
