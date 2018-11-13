import randomBytes from 'randombytes';

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
    this.allowCustomSignatureUrl = options.allowCustomSignatureUrl || false;
    this.appId = options.appId || '';
    this.appVersion = options.appVersion || config.main.appVersion;
    this.authLevel = options.authLevel || config.main.authLevels[0];
    this.gatewayZone = options.gatewayZone || config.constants.gatewayZones.internet;

    // Checkbox for timestamp and nonce auto-generation
    this.timestampAutoGen = true;
    this.nonceAutoGen = true;

    // Initial values
    this.timestamp = (new Date).getTime();
    this.nonce = randomBytes(32).toString('base64');

    // Need to attach directly to the object, not prototype for angular's model getterSetter
    // variables are getters/setters, hence they return functions
    this.authPrefix = authPrefix(this);
    this.signatureType = signatureType(this);
}

Signature.prototype.formSignature = function() {
    console.log('forming signature')
    this.basestring = '';
    this.signature = '';
}

Signature.prototype.timestampAutoGenChange = function() {
    if (this.timestampAutoGen) {
        this.timestamp = (new Date).getTime();
    } else {
        this.timestamp = '';
    }
}

Signature.prototype.nonceAutoGenChange = function() {
    if (this.nonceAutoGen) {
        this.nonce = randomBytes(32).toString('base64');
    } else {
        this.nonce = '';
    }
}

Signature.prototype.formSignatureUrl = function(apiUrl) {
    let signature = this;
    if (!signature.allowCustomSignatureUrl) {
        // Set signature url to an auto-generated one.
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
}

Signature.prototype.loadPkey = function(fileText) {
        this.pem = fileText;
}

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
    }
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
    }
}

export default Signature;