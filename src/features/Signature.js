import randomBytes from 'randombytes';

import config from '../service/config';

/**
 * 
 * @param {object} options
 * @param {boolean} options.allowCustomSignatureUrl
 * @param {string} options.appId
 * @param {string} options.appVersion
 * @param {number} options.authLevel
 * @param {string} options.gatewayZone
 * @param {string} options.signatureUrl
 */
function Signature(options) {
    // Initialization
    this.allowCustomSignatureUrl = options.allowCustomSignatureUrl;
    this.appId = options.appId;
    this.appVersion = options.appVersion;
    this.authLevel = options.authLevel;
    this.gatewayZone = options.gatewayZone;
    this.signatureUrl = options.signatureUrl;

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

Signature.prototype.allowCustomSignatureUrlChange = function(apiUrl) {
    if (!this.allowCustomSignatureUrl) {
        // Set signature url to an auto-generated one.
        if (apiUrl === '' || !apiUrl) { 
            this.signatureUrl = '';
        } else {
            let apexDomain = apiUrl.indexOf('.api.gov.sg');
            if (apexDomain !== -1) {
                let right = apiUrl.substring(apexDomain);
                let left = apiUrl.substring(0, apexDomain);
                let domainIdentifier = this.gatewayZone === config.constants.gatewayZones.internet ? 'e' : 'i';
                this.signatureUrl = `${left}.${domainIdentifier}${right}`;
            } else {
                this.signatureUrl = apiUrl;
            }
        }
    }
}

function formSignatureUrl() {
    if (controller.apiUrl === '' || !controller.apiUrl) return '';

    let apexDomain = controller.apiUrl.indexOf('.api.gov.sg');
    if (apexDomain !== -1) {
        let right = controller.apiUrl.substring(apexDomain);
        let left = controller.apiUrl.substring(0, apexDomain);
        let domainIdentifier = controller.gatewayZone === config.constants.gatewayZones.internet ? 'e' : 'i';
        return `${left}.${domainIdentifier}${right}`;
    } else { return controller.apiUrl; }
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