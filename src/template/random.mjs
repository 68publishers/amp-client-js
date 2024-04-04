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
                         <% if(null !== banner.positionData.dimensions.width) { %>width="<%- banner.positionData.dimensions.width %>"<% } %>
                         <% if(null !== banner.positionData.dimensions.height) { %>height="<%- banner.positionData.dimensions.height %>"<% } %>
                         <% if('' !== data.content.title) { %>title="<%- data.content.title %>"<% } %>
                         <% if(banner.options.has('loading')) { %>loading="<%- banner.options.get('loading') %>"<% } %>>
                </picture>
            </a>
        <% } else if ('html' === data.content.type) { %>
            <div class="amp-banner__content amp-banner__content--html">
                <%= data.content.html %>
            </div>
        <% } %>

    </div>
`;
