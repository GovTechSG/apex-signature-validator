import KJUR from 'jsrsasign';
import isEmpty from 'lodash/isEmpty';

import Signature from './Signature';
import paramsModal from './paramsModal';
import config from '../service/config';
import utilities from '../service/utilities';

signatureValidatorController.$inject = ['$scope', 'Notification', 'testRequestService', '$sce', '$uibModal'];

function signatureValidatorController($scope, Notification, testRequestService, $sce, $uibModal) {
    const controller = this;

    init();

    $scope.config = config;

    controller.addSignature = addSignature;
    controller.addUrlencodedBody = addUrlencodedBody;
    controller.allBaseStringsFormed = allBaseStringsFormed;
    controller.canSendTestRequest = canSendTestRequest;
    controller.compareBaseString = compareBaseString;
    controller.changeRequestBodyType = changeRequestBodyType;
    controller.generateAuthHeader = generateAuthHeader;
    controller.getApiTestHeaders = getApiTestHeaders;
    controller.getApiTestResponseClass = getApiTestResponseClass;
    controller.formSignatureUrls = formSignatureUrls;
    controller.onAllowCustomSignatureUrlChange = onAllowCustomSignatureUrlChange;
    controller.onApiUrlChange = onApiUrlChange;
    controller.onHttpMethodChange = onHttpMethodChange;
    controller.onRequestBodyChange = onRequestBodyChange;
    controller.onSignatureParameterChange = onSignatureParameterChange;
    controller.removeSignature = removeSignature;
    controller.removeUrlencodedBody = removeUrlencodedBody;
    controller.sendTestRequest = sendTestRequest;
    controller.showOptions = showOptions;

    function init() {
        controller.sendingTestRequest = false;
        controller.authHeader = '';

        controller.apiUrl = '';
        controller.httpMethods = config.main.httpMethods;
        controller.httpMethod = controller.httpMethods[0];
        controller.requestBodyType = config.constants.requestBodyTypes[0];
        controller.requestBody = {
            json: '',
            urlencoded: []
        };

        controller.gatewayZoneOptions = config.main.providerGateway;
        controller.authLevels = config.main.authLevels;

        controller.signatures = [];
    }

    function generateAuthHeader() {
        controller.authHeader = '';
        for (let i = 0; i < controller.signatures.length; i++) {
            let signature = controller.signatures[i];
            try {
                let key;
                if (signature.authLevel === 1) {
                    key = signature.appSecret;
                }
                if (signature.authLevel === 2) {
                    key = KJUR.KEYUTIL.getKey(signature.pem, signature.pkeySecret);
                }
                let signedBaseString = utilities.signBaseString(
                    signature.authLevel,
                    signature.baseString,
                    key
                );
                let authToken = utilities.generateAuthToken(
                    signature.baseStringOptions,
                    signedBaseString
                );
                controller.authHeader += authToken;
                if (i !== controller.signatures.length - 1) {
                    controller.authHeader += ', ';
                }
            } catch (exception) {
                controller.authHeader = '';
                Notification.error({
                    title: '',
                    message: config.main.errorMessages.signatureSecretInvalid,
                    delay: config.notificationShowTime
                });
            }
        }
    }

    /**
     * @returns {boolean} If no signatures configured or not all base strings have been formed, returns false.
     */
    function allBaseStringsFormed() {
        if (controller.signatures.length === 0) {
            return false;
        }
        return controller.signatures.reduce(function(accumm, currentSignature) {
            if (isEmpty(currentSignature.baseString)) {
                accumm = false;
            }
            return accumm;
        }, true);
    }

    function formSignatureUrls() {
        for (let signature of controller.signatures) {
            signature.formSignatureUrl(controller.apiUrl);
        }
    }

    function generateBaseStrings() {
        for (let signature of controller.signatures) {
            signature.generateBaseString({
                httpMethod: controller.httpMethod,
                requestBodyType: controller.requestBodyType,
                requestBody: controller.requestBody
            });
        }
    }

    function onRequestBodyChange() {
        generateBaseStrings();
        controller.authHeader = '';
    }

    function onAllowCustomSignatureUrlChange(signature) {
        if (!signature.allowCustomSignatureUrl) {
            signature.formSignatureUrl(controller.apiUrl);
            signature.generateBaseString({
                httpMethod: controller.httpMethod,
                requestBodyType: controller.requestBodyType,
                requestBody: controller.requestBody
            });
            controller.authHeader = '';
        }
    }

    function onApiUrlChange() {
        formSignatureUrls(); // Generate signature URL for each signature
        generateBaseStrings(); // Generate base string for each signature
        controller.authHeader = '';
    }

    function onHttpMethodChange() {
        // If changing to GET, change request body type to none
        if (controller.httpMethod === config.main.httpMethods[0]) { // GET
            controller.requestBodyType = config.constants.requestBodyTypes[0]; // none
        }
        // Change base string for signatures
        generateBaseStrings();
        // Change auth headers
        controller.authHeader = '';
    }

    function onSignatureParameterChange(signature) {
        signature.formSignatureUrl(controller.apiUrl);
        signature.generateBaseString({
            httpMethod: controller.httpMethod,
            requestBodyType: controller.requestBodyType,
            requestBody: controller.requestBody
        });
        controller.authHeader = '';
    }

    function addSignature() {
        controller.signatures.push(new Signature(controller.apiUrl, {
            allowCustomSignatureUrl: false,
            appId: '',
            appVersion: config.main.appVersion,
            authLevel: config.main.authLevels[0],
            gatewayZone: config.constants.gatewayZones.internet
        }));
    }

    function changeRequestBodyType() {
        if (controller.requestBodyType === 'application/x-www-form-urlencoded' &&
            controller.requestBody.urlencoded.length === 0) {
            addUrlencodedBody('', '');
        }
    }

    function addUrlencodedBody(key, value) {
        controller.requestBody.urlencoded.push({
            key: key,
            value: value
        });
    }

    function canSendTestRequest() {
        let condition = controller.apiUrl;
        if (controller.signatures.length > 0) {
            condition = condition && allBaseStringsFormed();
        }
        return condition;
    }

    /**
     * Removes signature at given position
     * @param {number} index Index for signature in controller.signatures.
     */
    function removeSignature(index) {
        controller.signatures.splice(index, 1);
    }

    function removeUrlencodedBody(index) {
        controller.requestBody.urlencoded.splice(index, 1);
    }

    function compareBaseString(signature, generated, input) {
        if (!input) {
            input = '';
        }
        signature.showBaseStringComparison = true;
        let before = false;
        let bsResults = '';
        for (let i = 0; i < generated.length; i++) {
            let gen = generated[i];
            let own = input[i];
            if (own == null) {
                let stringToAdd = generated.substring(i);
                bsResults += '<span class=\'missing-basestring-char\'>' + stringToAdd + '</span>';
                break;
            }
            if (gen !== own && !before) {
                own = '<span class=\'incorrect-basestring-char\'\'>' + own;
                before = true;
            } else if (gen === own && before) {
                own = '</span>' + own;
                before = false;
            }
            bsResults += own;
        }
        if (input.length > generated.length) {
            if (before) {
                bsResults += '</span>';
            }
            bsResults += '<span class = \'extra-basestring-char\'>' + input.substring(generated.length) + '</span>';
        }
        signature.baseStringComparison = $sce.trustAsHtml(bsResults);
        if (generated === input) {
            Notification.success({
                message: 'Basestrings are the same',
                delay: config.notificationShowTime
            });
        } else {
            Notification.error({
                message: 'Basestrings are different',
                delay: config.notificationShowTime
            });
        }
    }

    function sendTestRequest() {
        controller.sendingTestRequest = true;
        controller.apiTest = null;
        let requestOptions = {};
        if (controller.httpMethod !== 'GET') {
            requestOptions.requestBodyType = controller.requestBodyType;
            if (controller.requestBodyType === 'application/x-www-form-urlencoded') {
                // Reduce from array of [{key, value}, ...] to {key: value, ...}
                requestOptions.requestBody = controller.requestBody.urlencoded.reduce((finalObject, currentObject) => {
                    if (currentObject.key && currentObject.value) { // false if any of them are empty strings
                        finalObject[currentObject.key] = currentObject.value;
                    }
                    return finalObject;
                }, {});
            } else if (controller.requestBodyType === 'application/json') {
                requestOptions.requestBody = JSON.parse(controller.requestBody.json);
            }
        }
        if (allBaseStringsFormed()) {
            generateAuthHeader();
            if (controller.authHeader) {
                requestOptions.authHeader = controller.authHeader;
            } else {
                return;
            }
        }
        return testRequestService.sendTestRequest(controller.apiUrl, controller.httpMethod, requestOptions)
            .then(response => {
                controller.apiTest = response;
            })
            .catch(error => {
                controller.apiTest = error;
                if (error.xhrStatus === 'error' && error.status === -1) {
                    Notification.error({
                        message: config.main.errorMessages.httpRequestError,
                        delay: config.notificationShowTime
                    });
                }
            })
            .finally(() => {
                controller.sendingTestRequest = false;
            });
    }

    function showOptions() {
        $uibModal.open({
            animation: true,
            backdrop: false,
            template: paramsModal.template,
            controller: paramsModal.controller,
            controllerAs: '$ctrl',
            size: 'lg',
            resolve: {
                currentConfig: getCurrentConfig()
            }
        }).result
            .then(setCurrentConfig)
            .catch(function() { });
    }

    function getCurrentConfig() {
        let currentConfig = {
            httpMethod: controller.httpMethod,
            apiUrl: controller.apiUrl,
            signatures: controller.signatures.map(signature => signature.getConfig())
        };
        if (controller.httpMethod !== 'GET') {
            currentConfig.requestBodyType = controller.requestBodyType;
            currentConfig.requestBody = controller.requestBody;
            currentConfig.requestBody.urlencoded = currentConfig.requestBody.urlencoded.map(urlencodedBody => {
                return {
                    key: urlencodedBody.key,
                    value: urlencodedBody.value
                };
            });
        }
        if (controller.selectedLevel === 1) {
            currentConfig.appSecret = controller.appSecret;
        }
        return currentConfig;
    }

    function setCurrentConfig(config) {
        let newConfigParams = Object.keys(config);
        newConfigParams.forEach(function(param) {
            if (param !== 'signatures') {
                controller[param] = config[param];
            }
        });
        controller.signatures = [];
        if (config.signatures) {
            for (let signatureOptions of config.signatures) {
                let newSignature = new Signature(controller.apiUrl, signatureOptions);
                newSignature.generateBaseString({
                    httpMethod: controller.httpMethod,
                    requestBodyType: controller.requestBodyType,
                    requestBody: controller.requestBody
                });
                controller.signatures.push(newSignature);
            }
        }
    }

    function getApiTestHeaders(headers) {
        let headerString = '';
        let headerKeys = Object.keys(headers);
        for (let key of headerKeys) {
            headerString += `${key}: ${headers[key]}\n`;
        }
        return headerString;
    }

    function getApiTestResponseClass() {
        return {
            'bg-success': controller.apiTest.status < 300,
            'bg-warning': 300 <= controller.apiTest.status && controller.apiTest.status < 400,
            'bg-danger': (400 <= controller.apiTest.status && controller.apiTest.status < 600) || controller.apiTest.status === -1
        };
    }
}

export default signatureValidatorController;