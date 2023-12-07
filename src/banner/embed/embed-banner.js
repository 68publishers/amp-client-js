const Banner = require('../banner');

class EmbedBanner extends Banner {
    constructor(eventBus, uid, iframe, position, options) {
        super(eventBus, uid, iframe, position, options);
    }

    get fingerprints() {
        throw new Error('Property EmbedBanner.fingerprints is not readable.');
    }

    getCurrenBreakpoint(bannerId) {  // eslint-disable-line no-unused-vars
        throw new Error('Method EmbedBanner.getCurrenBreakpoint() is not readable.');
    }

    isEmbed() {
        return true;
    }

    updatePositionData(data) {
        const props = ['id', 'name', 'rotationSeconds', 'displayType', 'breakpointType'];
        const positionData = this.positionData;

        for (let prop of props) {
            if (prop in data) {
                positionData[prop] = data[prop];
            }
        }
    }
}

module.exports = EmbedBanner;
