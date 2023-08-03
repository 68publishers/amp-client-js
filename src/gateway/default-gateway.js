const AbstractGateway = require('./abstract-gateway');
const querystring = require('query-string').default;

class DefaultGateway extends AbstractGateway {
    fetch(request, success, error) {
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (XMLHttpRequest.DONE !== xhr.readyState || 0 === xhr.status) {
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
                    error: xhr.statusText || 'unknown',
                },
            });
        };

        let endpoint = request.endpoint;

        if ('GET' === request.method) {
            endpoint += `?${querystring.stringify(request.parameters)}`;
        }

        xhr.open(request.method, endpoint, true);
        xhr.overrideMimeType('application/json');
        xhr.setRequestHeader('Accept', 'application/json');

        for (let header of request.headers) {
            xhr.setRequestHeader(header.name, header.value);
        }

        xhr.send('POST' === request.method ? JSON.stringify(request.parameters) : null);
    }
}

module.exports = DefaultGateway;
