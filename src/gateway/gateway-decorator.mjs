import { AbstractGateway } from './abstract-gateway.mjs';

export class GatewayDecorator extends AbstractGateway {
    #gateway;

    constructor(gateway) {
        super();

        this.#gateway = gateway;
    }

    fetch(request, success, error) {
        const successDecorator = 2 > request.version
            ? response => {
                const {status, data, settings} = response;

                success({
                    status,
                    positions: data,
                    settings: settings || {},
                    response,
                });
            }
            : response => {
                const {status, data} = response;

                success({
                    status,
                    positions: data.positions || {},
                    settings: data.settings || {},
                    response,
                });
            };

        this.#gateway.fetch(
            request,
            successDecorator,
            error,
        );
    }
}
