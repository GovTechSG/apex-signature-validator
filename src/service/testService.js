import KJUR from 'jsrsasign';

function testService($http, UtilityService, $httpParamSerializerJQLike) {
    return {    
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
        genAuthHeader(basestringOptions, signature) {
            let realm = basestringOptions.realm || basestringOptions.appId;
            let authPrefix = basestringOptions.authPrefix;
            return `${authPrefix.charAt(0).toUpperCase()}${authPrefix.slice(1)} realm="${realm}", ` +
                `${authPrefix}_app_id="${basestringOptions.appId}", ` +
                `${authPrefix}_nonce="${basestringOptions.nonce}", ` +
                `${authPrefix}_signature_method="${basestringOptions.signatureMethod}", ` +
                `${authPrefix}_signature="${signature}", ` +
                `${authPrefix}_timestamp="${basestringOptions.timestamp}", ` +
                `${authPrefix}_version="${basestringOptions.appVersion}"`;
        },
        /**
         * @param url URL to call
         * @param method HTTP method
         * @param authLevel Apex authentication level
         * @param [options.requestBody] Request body for http method !== GET
         * @param [options.requestBodyType] Selected request body type: none, application/json, application/x-www-form-urlencoded
         * @param [options.authHeader] Auth token containing L1/L2 signature. If authLevel === 1 or 2
         */
        sendTestRequest(url, method, authLevel, options) {
            let requestOptions = {
                method: method,
                url: url,
                headers: {},
                timeout: 10000
            };
            if (method !== 'GET' && options.requestBody) {
                if (options.requestBodyType === 'application/x-www-form-urlencoded') {
                    requestOptions.data = $httpParamSerializerJQLike(options.requestBody);
                    requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                } else {
                    requestOptions.data = options.requestBody; // By default json
                }
            }

            if (authLevel !== 0) {
                requestOptions.headers['Authorization'] = options.authHeader;
            }

            return $http(requestOptions);
        }
    };
}

testService.$inject = ['$http', 'UtilityService', '$httpParamSerializerJQLike'];

export default testService;