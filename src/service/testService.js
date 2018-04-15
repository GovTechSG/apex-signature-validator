import KJUR from 'jsrsasign';

function testService($http, UtilityService) {
    return {
        /**
         * APEX Base string generation
         *
         * @param params.request and params.uri always required, used to generate the beginning of the base string.
         * params.request: HTTP Method: GET, POST etc
         * params.uri: Signature URL - ${protocol}//${hostname}${pathname} (query strings need to be stripped)
         *
         * @param params.realm Unused.
         *
         * @param params.prefix Prefix added to other param keys, see below
         *
         * @param params Required params (below) and query string params
         * The following are appended to params.prefix:
         * params.app_id: App ID
         * params.nonce: Nonce.
         * params.signature_method: HMACSHA256 or SHA256withRSA
         * params.timestamp: Unix timestamp
         * params.version: Version number, 1.0 by default
         *
         * The above params are then sorted before being used to construct the base string.
         *
         * @returns {string} Base string in the format: ${httpMethod}&${signatureUrl}&${sortedKeyValuePairs}
         */
        generateBasestring(params) {
            let sortedParams = UtilityService.sortJSON(params);
            let sortedKeys = Object.keys(sortedParams);
            let baseString = sortedParams.request.toUpperCase() + '&' + sortedParams.uri;
            for (let key of sortedKeys) {
                if (!['request', 'uri', 'realm', 'prefix'].includes(key)) {
                    baseString += '&' + key + '=' + sortedParams[key];
                }
            }
            return baseString;
        },
        signBasestring(selectedLevel, basestring, key) {
            let kjur, sig;
            if (selectedLevel === 2) {
                kjur = new KJUR.crypto.Signature({
                    'alg': 'SHA256withRSA'
                });
                kjur.init(key);
                kjur.updateString(basestring);
                let sigVal = kjur.sign();
                sig = UtilityService.hexToBase64(sigVal);
            } else if (selectedLevel === 1) {
                kjur = new KJUR.crypto.Mac({
                    alg: 'HmacSHA256',
                    'pass': {
                        'hex': UtilityService.ascii_to_hexa(key)
                    }
                });
                kjur.updateString(basestring);
                let hmacDigest = kjur.doFinal();
                sig = UtilityService.hexToBase64(hmacDigest);
            }
            return sig;
        },
        genAuthHeader: function(params, signature) {
            let prefix = params.prefix + '_';
            params[prefix + 'signature'] = signature;

            let sortedParams = UtilityService.sortJSON(params);
            let keys = Object.keys(sortedParams);
            //remove realm and add to front
            keys.splice(keys.indexOf('realm'), 1);
            keys.unshift('realm');
            let authHeader = 'Authorization: ' + params['prefix'].charAt(0).toUpperCase() + params['prefix'].slice(1) + ' ';
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] === 'prefix' || keys[i] === 'uri' || keys[i] === 'request' || keys[i].indexOf(prefix) === -1) {
                    continue;
                }
                if (keys[i] !== 'realm') {
                    authHeader += keys[i] + '="' + sortedParams[keys[i]] + '",';
                } else {
                    authHeader += keys[i] + '="' + sortedParams['realm'] + '",';
                }
            }
            return authHeader;
        },
        sendTestRequest: function(url, method, auth, level) {
            if (level === 0) {
                return $http({
                    method: method,
                    url: url
                });
            } else {
                return $http({
                    method: method,
                    url: url,
                    headers: {
                        'Authorization': auth
                    }
                });
            }
        }
    };
}

testService.$inject = ['$http', 'UtilityService'];

export default testService;