const AbstractGateway = require('./abstract-gateway');
const DefaultGateway = require('./default-gateway');

module.exports = {
    isGateway: (gateway) => {
        return gateway instanceof AbstractGateway;
    },
    create: () => {
        return new DefaultGateway();
    },
};
