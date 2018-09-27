import KJUR from 'jsrsasign';
import qs from 'querystring';

function testService($http, UtilityService) {
    return {
        /**
         * Formulate Apex Signature base string
         *
         * @param {object} basestringOptions Base string formulation request properties in JSON object
         * @param {string} basestringOptions.signatureUrl API signature URL
         * @param {string} basestringOptions.authPrefix Apex auth prefix
         * @param {string} basestringOptions.signatureMethod If L1 auth, HMACSHA256; if L2 auth, SHA256withRSA
         * @param {string} basestringOptions.appId Apex app ID
         * @param {string} basestringOptions.httpMethod HTTP Verb
         * @param {string} basestringOptions.appVersion Apex app version
         * @param {number} basestringOptions.nonce A nonce. Use once only
         * @param {number} basestringOptions.timestamp Unix timestamp (ms)
         * @param {object} [basestringOptions.queryString] Query string in API
         * @param {object} [basestringOptions.formData] HTTP POST or PUT body in x-www-form-urlencoded format
         *
         * @returns {string} sigBaseString Signature base string for signing
         * @public
         */
        generateBasestring(basestringOptions) {
            const signatureUrl = new URL(basestringOptions.signatureUrl);

            if (signatureUrl.protocol !== 'http:' && signatureUrl.protocol !== 'https:') {
                throw new Error('Only http and https protocols are supported');
            }

            // Remove port from url
            delete signatureUrl.port;
            let basestringUrl = signatureUrl.origin + signatureUrl.pathname;

            let defaultParams = {};

            let prefixedAppId = basestringOptions.authPrefix.toLowerCase() + '_app_id';
            let prefixedNonce = basestringOptions.authPrefix.toLowerCase() + '_nonce';
            let prefixedSignatureMethod = basestringOptions.authPrefix.toLowerCase() + '_signature_method';
            let prefixedTimestamp = basestringOptions.authPrefix.toLowerCase() + '_timestamp';
            let prefixedVersion = basestringOptions.authPrefix.toLowerCase() + '_version';

            defaultParams[prefixedAppId] = basestringOptions.appId;
            defaultParams[prefixedNonce] = basestringOptions.nonce;
            defaultParams[prefixedSignatureMethod] = basestringOptions.signatureMethod;
            defaultParams[prefixedTimestamp] = basestringOptions.timestamp;
            defaultParams[prefixedVersion] = basestringOptions.appVersion;

            // Add support to handle array in QueryString and name collision between queryString and formData
            let paramsArray = parseParams(defaultParams);

            // Found query string in url, transfer to params property
            if (signatureUrl.search != null && signatureUrl.search.length > 0) {
                let params = qs.parse(signatureUrl.search.slice(1));
                paramsArray = paramsArray.concat(parseParams(params));
            }

            if (basestringOptions.queryString != null) {
                paramsArray = paramsArray.concat(parseParams(basestringOptions.queryString));
            }

            if (basestringOptions.formData != null) {
                paramsArray = paramsArray.concat(parseParams(basestringOptions.formData));
            }

            // Join name value pair with = (remove = if value is empty) and combine multiple name value pair with & 
            let stringParams = paramsArray.sort().map(element => {
                //Check if key value is present before appending with '='
                if (element.length > 1 && element[1] === '') {
                    return element[0];
                } else {
                    return element.join('=');
                }
            }).join('&');

            return basestringOptions.httpMethod.toUpperCase() + '&' + basestringUrl + '&' + stringParams;
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
        genAuthHeader: function(basestringOptions, signature) {
            let realm = basestringOptions.realm || basestringOptions.appId;
            let authPrefix = basestringOptions.authPrefix;
            console.log(
                `${authPrefix.charAt(0).toUpperCase()}${authPrefix.slice(1)} realm="${realm}", ` +
                `${authPrefix}_timestamp="${basestringOptions.timestamp}", ` +
                `${authPrefix}_nonce="${basestringOptions.nonce}", ` +
                `${authPrefix}_app_id="${basestringOptions.appId}", ` +
                `${authPrefix}_signature_method="${basestringOptions.signatureMethod}", ` +
                `${authPrefix}_signature="${signature}", ` +
                `${authPrefix}_version="${basestringOptions.appVersion}"`
            );
            return `${authPrefix.charAt(0).toUpperCase()}${authPrefix.slice(1)} realm="${realm}", ` +
                `${authPrefix}_timestamp="${basestringOptions.timestamp}", ` +
                `${authPrefix}_nonce="${basestringOptions.nonce}", ` +
                `${authPrefix}_app_id="${basestringOptions.appId}", ` +
                `${authPrefix}_signature_method="${basestringOptions.signatureMethod}", ` +
                `${authPrefix}_signature="${signature}", ` +
                `${authPrefix}_version="${basestringOptions.appVersion}"`;
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

function capitalizePrefix(prefix) {
    return prefix.charAt(0).toUpperCase() + prefix.substring(1);
}

/**
 * Parse an object by converting it to a 2-item array for further processing.
 * This is to remove queryString or formData with null value, empty string or duplicate key name
 * @param {object} params object to have its params sorted and parsed
 * @returns {Array} 2-dimension Array that consists of the query or formData params
 */
function parseParams(params) {
    // JSON does not support property with sub-object as shown below
    // convert json from { "name" : { "name1" : "value1" } to { "name" : "" }
    let safeQueryStringJson = qs.parse(qs.stringify(params));

    let result = [];
    let keys = Object.keys(safeQueryStringJson);

    keys.forEach(function(key) {
        if (Array.isArray(safeQueryStringJson[key])) {
            // Convert array value to name=value,name=value
            safeQueryStringJson[key].forEach(function(value) {
                result.push([key, value]);
            });
        } else {
            result.push([key, safeQueryStringJson[key]]);
        }
    });
    return result;
}

testService.$inject = ['$http', 'UtilityService'];

export default testService;