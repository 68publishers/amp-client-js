'use strict';

(function (Client) {

    class ClientFactory {
        static create(options = {}) {
            return new Client(options);
        }
    }

    module.exports = ClientFactory;

})(require('./client'));
