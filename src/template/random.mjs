/**
 * {ManagedBanner} banner
 * {BannerData} data
 */
export default `
    <div class="amp-banner amp-banner--random"
         data-amp-banner-fingerprint="<%= data.fingerprint %>">

        <% if('img' === data.content.type) { %>
            <a class="amp-banner__content amp-banner__content--img"
               href="<%= data.content.href %>"
               <% if(null !== data.content.target) { %>target="<%- data.content.target %>"<% } %>>
                <picture>
                    <% (data.content.sources || []).forEach(function(source) { %>
                        <source type="<%= source.type %>"
                                srcset="<%= source.srcset %>"
                                sizes="<%- data.content.sizes %>">
                    <% }); %>
                    <img srcset="<%= data.content.srcset %>"
                         src="<%= data.content.src %>"
                         sizes="<%- data.content.sizes %>"
                         alt="<%- data.content.alt %>"
                         <% if(null !== data.content.dimensions.width) { %>width="<%- data.content.dimensions.width %>"<% } %>
                         <% if(null !== data.content.dimensions.height) { %>height="<%- data.content.dimensions.height %>"<% } %>
                         <% if('' !== data.content.title) { %>title="<%- data.content.title %>"<% } %>
                         <% var loading; if(loading = banner.options.evaluate('loading', 0)) { %>loading="<%- loading %>"<% } %>
                         <% var fetchPriority; if(fetchPriority = banner.options.evaluate('fetchpriority', 0)) { %>fetchpriority="<%- fetchPriority %>"<% } %>>
                </picture>
            </a>
        <% } else if ('html' === data.content.type) { %>
            <div class="amp-banner__content amp-banner__content--html">
                <%= data.content.html %>
            </div>
        <% } %>

    </div>
`;
