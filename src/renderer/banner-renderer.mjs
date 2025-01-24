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
        let bannerData = banner.bannerData;
        bannerData = !Array.isArray(bannerData) ? bannerData : bannerData.filter(d => null !== d.content);

        return this.#loader.getTemplate(banner.positionData.displayType)({
            banner: banner,
            data: bannerData,
        });
    }
}
