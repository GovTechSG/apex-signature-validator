import randomBytes from 'randombytes';
import isEmpty from 'lodash/isEmpty';
import qs from 'querystring';

import config from '../service/config';

/**
 * @param {string} apiUrl
 * @param {object} options
 * @param {boolean} options.allowCustomSignatureUrl
 * @param {string} options.appId
 * @param {string} options.appVersion
 * @param {number} options.authLevel
 * @param {string} options.gatewayZone
 */
function Signature(apiUrl, options) {
    // Initialization
    if (!options) {
        options = {};
    }
    this.formSignatureUrl(apiUrl); // Initialize signature URL
    this.allowCustomSignatureUrl = options.allowCustomSignatureUrl;
    this.appId = options.appId;
    this.appVersion = options.appVersion;
    this.authLevel = options.authLevel;
    this.gatewayZone = options.gatewayZone;

    // Checkbox for timestamp and nonce auto-generation
    this.timestampAutoGen = true;
    this.nonceAutoGen = true;

    // Initial values
    this.timestamp = (new Date).getTime();
    this.nonce = randomBytes(32).toString('base64');
    this.showBaseString = true;

    // Need to attach directly to the object, not prototype for angular's model getterSetter
    // variables are getters/setters, hence they return functions
    this.authPrefix = authPrefix(this);
    this.signatureType = signatureType(this); // HMAC or RSA. Renamed from signatureMethod to prevent confusion with HTTP method.
}

/**
 * @param {object} httpRequestOptions HTTP request is set at the controller and needs to be passed to this function
 * @param {string} httpRequestOptions.httpMethod GET, POST, etc
 * @param {string} httpRequestOptions.requestBodyType none, application/json, application/x-www-form-urlencoded
 * @param {object} httpRequestOptions.requestBody { json: JSON string, urlencoded: array of {key, value} objects }
 */
Signature.prototype.generateBaseString = function(httpRequestOptions) {
    if (!httpRequestOptions) {
        throw new Error('Error generating base string: http request options required.');
    }
    if (isEmpty(this.signatureUrl) || isEmpty(this.appId ||
        isEmpty(this.timestamp) || isEmpty(this.nonce))) {
        this.baseString = '';
        return;
    }
    let baseStringOptions = {
        signatureUrl: this.signatureUrl,
        authPrefix: this.authPrefix(),
        signatureMethod: this.signatureType(),
        appId: this.appId,
        httpMethod: httpRequestOptions.httpMethod,
        appVersion: this.appVersion,
        nonce: this.nonce,
        timestamp: this.timestamp
    };
    this.baseStringOptions = baseStringOptions;
    // Process x-www-form-urlencoded body
    if (httpRequestOptions.httpMethod !== 'GET' &&
        httpRequestOptions.requestBodyType === 'application/x-www-form-urlencoded' &&
        httpRequestOptions.requestBody.urlencoded.length > 0) {
        baseStringOptions.formData = httpRequestOptions.requestBody.urlencoded.reduce((finalObject, currentObject) => {
            if (currentObject.key && currentObject.value) { // false if any of them are empty strings
                finalObject[currentObject.key] = currentObject.value;
            }
            return finalObject;
        }, {});
    }
    this.baseString = getBaseString(baseStringOptions);
};

Signature.prototype.generateTimestamp = function() {
    this.timestamp = (new Date).getTime();
};

Signature.prototype.generateNonce = function() {
    this.nonce = randomBytes(32).toString('base64');
};

Signature.prototype.timestampAutoGenChange = function() {
    if (this.timestampAutoGen) {
        this.timestamp = (new Date).getTime();
    } else {
        this.timestamp = '';
    }
};

Signature.prototype.nonceAutoGenChange = function() {
    if (this.nonceAutoGen) {
        this.nonce = randomBytes(32).toString('base64');
    } else {
        this.nonce = '';
    }
};

Signature.prototype.formSignatureUrl = function(apiUrl) {
    let signature = this;
    // Set signature url to an auto-generated one.
    if (!signature.allowCustomSignatureUrl) {
        if (apiUrl === '' || !apiUrl) {
            signature.signatureUrl = '';
        } else {
            let apexDomain = apiUrl.indexOf('.api.gov.sg');
            if (apexDomain !== -1) {
                let right = apiUrl.substring(apexDomain);
                let left = apiUrl.substring(0, apexDomain);
                let domainIdentifier = signature.gatewayZone === config.constants.gatewayZones.internet ? 'e' : 'i';
                signature.signatureUrl = `${left}.${domainIdentifier}${right}`;
            } else {
                signature.signatureUrl = apiUrl;
            }
        }
    }

};

Signature.prototype.loadPkey = function(fileText) {
    this.pem = fileText;
};

function signatureType(signature) {
    return function() {
        switch (signature.authLevel) {
        case 0:
            return '';
        case 1:
            return config.main.sigMethod.level1;
        case 2:
            return config.main.sigMethod.level2;
        }
    };
}

function authPrefix(signature) {
    return function() {
        if (signature.gatewayZone === config.constants.gatewayZones.internet) {
            switch (signature.authLevel) {
            case 1:
                return 'apex_l1_eg';
            case 2:
                return 'apex_l2_eg';
            default:
                return '';
            }
        } else if (signature.gatewayZone === config.constants.gatewayZones.intranet) {
            switch (signature.authLevel) {
            case 1:
                return 'apex_l1_ig';
            case 2:
                return 'apex_l2_ig';
            default:
                return '';
            }
        }
    };
}

/**
 * Formulate Apex Signature base string
 *
 * @param {object} baseStringOptions Base string formulation request properties in JSON object
 * @param {string} baseStringOptions.signatureUrl API signature URL
 * @param {string} baseStringOptions.authPrefix Apex auth prefix
 * @param {string} baseStringOptions.signatureMethod If L1 auth, HMACSHA256; if L2 auth, SHA256withRSA
 * @param {string} baseStringOptions.appId Apex app ID
 * @param {string} baseStringOptions.httpMethod HTTP Verb
 * @param {string} baseStringOptions.appVersion Apex app version
 * @param {number} baseStringOptions.nonce A nonce. Use once only
 * @param {number} baseStringOptions.timestamp Unix timestamp (ms)
 * @param {object} [baseStringOptions.queryString] Query string in API
 * @param {object} [baseStringOptions.formData] HTTP POST or PUT body in x-www-form-urlencoded format
 *
 * @returns {string} sigBaseString Signature base string for signing
 * @public
 */
function getBaseString(baseStringOptions) {
    const signatureUrl = new URL(baseStringOptions.signatureUrl);

    if (signatureUrl.protocol !== 'http:' && signatureUrl.protocol !== 'https:') {
        throw new Error('Only http and https protocols are supported');
    }

    // Remove port from url
    delete signatureUrl.port;
    let baseStringUrl = signatureUrl.origin + signatureUrl.pathname;

    let defaultParams = {};

    let prefixedAppId = baseStringOptions.authPrefix.toLowerCase() + '_app_id';
    let prefixedNonce = baseStringOptions.authPrefix.toLowerCase() + '_nonce';
    let prefixedSignatureMethod = baseStringOptions.authPrefix.toLowerCase() + '_signature_method';
    let prefixedTimestamp = baseStringOptions.authPrefix.toLowerCase() + '_timestamp';
    let prefixedVersion = baseStringOptions.authPrefix.toLowerCase() + '_version';

    defaultParams[prefixedAppId] = baseStringOptions.appId;
    defaultParams[prefixedNonce] = baseStringOptions.nonce;
    defaultParams[prefixedSignatureMethod] = baseStringOptions.signatureMethod;
    defaultParams[prefixedTimestamp] = baseStringOptions.timestamp;
    defaultParams[prefixedVersion] = baseStringOptions.appVersion;

    // Add support to handle array in QueryString and name collision between queryString and formData
    let paramsArray = parseParams(defaultParams);

    // Found query string in url, transfer to params property
    if (signatureUrl.search != null && signatureUrl.search.length > 0) {
        let params = qs.parse(signatureUrl.search.slice(1));
        paramsArray = paramsArray.concat(parseParams(params));
    }

    if (baseStringOptions.queryString != null) {
        paramsArray = paramsArray.concat(parseParams(baseStringOptions.queryString));
    }

    if (baseStringOptions.formData != null) {
        paramsArray = paramsArray.concat(parseParams(baseStringOptions.formData));
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

    return baseStringOptions.httpMethod.toUpperCase() + '&' + baseStringUrl + '&' + stringParams;
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

export default Signature;