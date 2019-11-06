'use strict';

(function (AbstractGateway, DefaultGateway) {

    const _createGateway = () => {
        // @todo: resolve JqueryAjaxGateway and NetteAjaxGateway here.
        return new DefaultGateway();
    };

    module.exports = {
        isGateway: (gateway) => {
            return gateway instanceof AbstractGateway;
        },
        create: _createGateway
    };

})(require('./abstract-gateway'), require('./default-gateway'));
