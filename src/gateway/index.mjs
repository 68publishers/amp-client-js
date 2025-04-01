import { AbstractGateway } from './abstract-gateway.mjs';
import { DefaultGateway } from './default-gateway.mjs';
import { GatewayDecorator } from './gateway-decorator.mjs';

export function isGateway (gateway) {
    return gateway instanceof AbstractGateway;
}

export function createGateway() {
    return new GatewayDecorator(
        new DefaultGateway(),
    );
}
