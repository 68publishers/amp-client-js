'use strict';

(function (AbstractGateway, querystring) {

    class DefaultGateway extends AbstractGateway {

        fetch(request, success, error) {
            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (4 !== xhr.readyState || 0 === xhr.status) {
                    return false;
                }

                const response = JSON.parse(xhr.responseText);

                if (200 <= xhr.status && 300 > xhr.status) {
                    success(response);
                } else {
                    error(response);
                }
            };

            xhr.onerror = () => {
                error({
                    status: 'error',
                    data: {
                        code: xhr.status,
                        error: xhr.statusText || 'unknown'
                    }
                });
            };

            xhr.open(
                request.method,
                `${request.endpoint}?${querystring.stringify(request.parameters)}`,
                true
            );

            xhr.overrideMimeType('application/json');
            xhr.send();
        }
    }

    module.exports = DefaultGateway;

})(require('./abstract-gateway'), require('querystring'));
