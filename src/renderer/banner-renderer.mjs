import { TemplateLoader } from './temnplate-loader.mjs';

export class BannerRenderer {
    #loader;

    constructor (templates) {
        this.#loader = new TemplateLoader(templates);
    }

    /**
     * @param {ManagedBanner} banner
     */
    render(banner) {
        return this.#loader.getTemplate(banner.positionData.displayType)({
            banner: banner,
            data: banner.bannerData,
        });
    }
}

