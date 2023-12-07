'use strict';

const AMPClientFactory = require('./src/client/standard/client-factory');
const EmbedAMPClientFactory = require('./src/client/embed/client-factory');

module.exports = AMPClientFactory;
module.exports.AMPClientFactory = AMPClientFactory;
module.exports.EmbedAMPClientFactory = EmbedAMPClientFactory;
