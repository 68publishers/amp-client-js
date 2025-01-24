/**
 * {ManagedBanner} banner
 * {Array<BannerData>} data
 */
export default `
    <% if(data.length) { %>
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
                                         <% if(null !== b.content.dimensions.width) { %>width="<%- b.content.dimensions.width %>"<% } %>
                                         <% if(null !== b.content.dimensions.height) { %>height="<%- b.content.dimensions.height %>"<% } %>
                                         <% if('' !== b.content.title) { %>title="<%- b.content.title %>"<% } %>
                                         <% var loading; if(loading = banner.options.evaluate('loading', index)) { %>loading="<%- loading %>"<% } %>
                                         <% var fetchPriority; if(fetchPriority = banner.options.evaluate('fetchpriority', index)) { %>fetchpriority="<%- fetchPriority %>"<% } %>>
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
    <% } %>
`;
