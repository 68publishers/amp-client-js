/**
 * {ManagedBanner} banner
 * {Array<BannerData>} data
 */
module.exports = `
    <div class="amp-banner amp-banner--multiple">
        <div class="amp-banner__list">
            <% for (index in data) { var b = data[index]; %>
                <div class="amp-banner__item"
                     data-amp-banner-fingerprint="<%= b.fingerprint %>">

                    <% if('img' === b.content.type) { %>
                        <a class="amp-banner__content amp-banner__content--img"
                           href="<%= b.content.href %>"
                           <% if(null !== b.content.target) { %>target="<%- b.content.target %>"<% } %>>
                            <picture>
                                <% (b.content.sources || []).forEach(function(source) { %>
                                    <source type="<%= source.type %>"
                                            srcset="<%= source.srcset %>"
                                            sizes="<%- b.content.sizes %>">
                                <% }); %>
                                <img srcset="<%= b.content.srcset %>"
                                     src="<%= b.content.src %>"
                                     sizes="<%- b.content.sizes %>"
                                     alt="<%- b.content.alt %>"
                                     <% if('' !== b.content.title) { %>title="<%- b.content.title %>"<% } %>
                                     <% if(banner.options.has('loading') && index >= parseInt(banner.options.get('loading-offset', 0))) { %>loading="<%- banner.options.get('loading') %>"<% } %>>
                            </picture>
                        </a>
                    <% } else if ('html' === b.content.type) { %>
                        <div class="amp-banner__content amp-banner__content--html">
                            <%= b.content.html %>
                        </div>
                    <% } %>

                </div>
            <% } %>
        </div>
    </div>
`;
