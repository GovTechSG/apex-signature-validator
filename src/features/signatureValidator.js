import KJUR from 'jsrsasign';
import randomBytes from 'randombytes';

import paramsModal from './paramsModal';

let signatureValidatorTemplate = `
<div class="container-fluid main-content">

<h3 style="display: inline-block">Apex Signature Validator</h3>
<h5 ng-click="$ctrl.showOptions()" style="float: right">
        <a href><span class="glyphicon glyphicon-cog"></span> Load/save From JSON</a>
</h5>

<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-12" style="text-align:center">
                <h4><span class="label label-primary">1</span> HTTP Request parameters</h4>                
            </div>
        </div>
    </div>

    <div class="panel-body">
        <form name="httpRequestForm">
            <div class="row">
                <div class="col-md-6">
                    <label>API Gateway Zone</label>
                    <label class="radio-inline" ng-repeat="gatewayZone in gatewayZoneOptions">
                        <input type="radio" name="gatewayZoneOptions" ng-model="$ctrl.gatewayZone" value="{{gatewayZone}}" 
                            ng-change="$ctrl.formSignatureUrl(); formSignature()">
                        {{gatewayZone}}
                    </label>
                </div>
            </div>
            
            <br>
        
            <div class="row">
                <div class="col-md-2">
                    <label for="httpMethodSelector">Request</label>
                    <select id="httpMethodSelector" ng-change="formSignature()" ng-options="httpMethod for httpMethod in httpMethods" 
                            ng-model="$ctrl.httpMethod" class="form-control">
                    </select>
                </div>

                <div class="col-md-10">
                    <label for="apiUrl">API URL</label>

                    <input type="text" autocomplete="off" class="form-control" name="apiUrl" id="apiUrl"
                        ng-change="$ctrl.formSignatureUrl(); formSignature()" ng-model="$ctrl.apiUrl" required
                        placeholder="https://mygateway.api.gov.sg/myservice/api/v1/users">
                    
                    <span ng-show="httpRequestForm.apiUrl.$touched && httpRequestForm.apiUrl.$invalid" class="fail">
                        API URL is required.
                    </span>
                </div>
            </div>

            <br>

            <div class="row">
                <div class="col-md-12">
                    <label for="signatureUrl">Signature URL</label> <span class="glyphicon glyphicon-info-sign" tooltip-placement="top" uib-tooltip="{{ config.constants.strings.signatureUrl }}"></span>
                    
                    <label style="float:right">
                        <input type="checkbox" ng-model="$ctrl.customSignatureUrl" ng-change="$ctrl.onToggleCustomSignatureUrl()"></input>    
                        Custom signature URL
                    </label>

                    <input type="text" name="signatureUrl" id="signatureUrl" class="form-control" placeholder="https://mygateway.api.gov.sg/myservice/api/v1/users"
                        ng-model="$ctrl.signatureUrl" ng-disabled="!$ctrl.customSignatureUrl" ng-change="formSignature()">
                </div>
            </div>

            <br>

            <div class="row" ng-if="$ctrl.httpMethod === 'POST'">
                <div class="col-md-12">
                    <b>POST body (only if POST body encoding is application/x-www-form-urlencoded)</b> <a href ng-click="$ctrl.addPostBody('','')"> <span class="glyphicon glyphicon-plus"></span>Add</a>        
                </div>
            </div>

            <fieldset class="form-horizontal" ng-if="$ctrl.postBody.length > 0">
                <br>
                <div class="row" ng-repeat="kvpair in $ctrl.postBody">
                    <div class="col-sm-6">
                        <div class="form-group">
                            <label class="col-sm-2 control-label" for="{{ 'postBodyKey' + $index }}">Key</label>
                            <div class="col-sm-10">
                                <input type="text" id="{{ 'postBodyKey' + $index }}" class="form-control" ng-model="kvpair.key" ng-change="formSignature()">
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-sm-5">
                        <div class="form-group">
                            <label class="col-sm-2 control-label" for="{{ 'postBodyValue' + $index }}">Value</label>
                            <div class="col-sm-10">
                                <input type="text" id="{{ 'postBodyValue' + $index }}" class="form-control" ng-model="kvpair.value" ng-change="formSignature()">
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-1">
                        <button type="button" class="btn btn-danger" ng-click="$ctrl.removePostBody($index)">
                            <span class="glyphicon glyphicon-remove"></span>
                        </button>
                    </div>
                </div>
            </fieldset>        
        </form>
    </div>
</div>

<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-12" style="text-align:center">
                <h4><span class="label label-primary">2</span> Apex Authentication Parameters</h4>
                <div class="btn-group">
                    <button ng-repeat="level in $ctrl.authLevels" class="btn btn-default" 
                        ng-click="$ctrl.changeAuthLevel(level)" ng-class="{active: $ctrl.selectedLevel === level}">
                        L{{level}}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="panel-body">
        <div class="row">
            <div class="col-sm-12" ng-if="$ctrl.selectedLevel === 0" style="text-align:center">
                <strong style="text-align:center">No authentication required for L0</strong>
            </div>
            <div class="col-sm-12 "  ng-if="$ctrl.selectedLevel === 1 || $ctrl.selectedLevel === 2">
                <form name="authParamsForm">
                    <h4 style="text-align:center">Required Parameters For L{{$ctrl.selectedLevel}} Authentication</h4>

                    <div class="row">
                        <div ng-class="{'col-md-6': $ctrl.selectedLevel === 2, 'col-md-4': $ctrl.selectedLevel === 1}">
                            <label for="authPrefix">Auth Prefix</label>

                            <input type="text" class="form-control" name="authPrefix" id="authPrefix" required disabled
                                ng-model="$ctrl.authPrefix" 
                                ng-model-options="{ getterSetter: true }"
                                ng-change="formSignature()">

                            <span ng-show="authParamsForm.authPrefix.$touched && authParamsForm.authPrefix.$invalid" class="fail">
                                Auth Prefix is required.
                            </span>
                        </div>

                        <div ng-class="{'col-md-6': $ctrl.selectedLevel === 2, 'col-md-4': $ctrl.selectedLevel === 1}">
                            <label for="appId">Application ID</label>

                            <input type="text" name="appId" id="appId" class="form-control" required
                                ng-model="$ctrl.appId" ng-change="formSignature()">

                            <span ng-show="authParamsForm.appId.$touched && authParamsForm.appId.$invalid" class="fail">
                                App Id is required.
                            </span>
                        </div>

                        <div class="col-md-4" ng-if="$ctrl.selectedLevel === 1">
                            <label for="appSecret">Application Secret</label>

                            <input type="text" name="appSecret" id="appSecret" required class="form-control"
                                   ng-model="$ctrl.appSecret" ng-change="formSignature()">

                            <span ng-show="authParamsForm.appSecret.$touched && authParamsForm.appSecret.$invalid" class="fail">
                                App Secret is required.
                            </span>
                        </div>
                    </div>

                    <br>

                    <div class="row">
                        <div class="col-md-6">
                            <label for="signatureMethod">Signature Method</label>
                            <input type="text" class="form-control" name="signatureMethod" id="signatureMethod" disabled
                                ng-model="$ctrl.signatureMethod"
                                ng-model-options="{ getterSetter: true }">
                        </div>

                        <div class="col-md-6">
                            <label for="appVersion">App Version</label>
                            <input type="text" class="form-control" name="appVersion" id="appVersion" ng-model="$ctrl.appVersion" disabled>
                        </div>
                    </div>

                    <br>

                    <div class="row">
                        <div class="col-md-6">
                            <label for="timestamp">Timestamp</label>
                            <label style="float:right">
                                <small>auto-generate:</small>
                                <input type="checkbox" ng-model="timestampDisabled" ng-change="timestampGenChange()">
                            </label>
                            <input type="text" class="form-control" required name="timestamp" id="timestamp"
                                ng-model="$ctrl.timestamp" ng-disabled="timestampDisabled" ng-change="formSignature()">
                            <span ng-show="authParamsForm.timestamp.$touched && authParamsForm.timestamp.$invalid" class="fail">
                                Timestamp is required.
                            </span>
                        </div>
                        <div class="col-md-6">
                            <label for="nonce">Nonce</label>
                            <label style="float:right">
                                <small>auto-generate:</small>
                                <input type="checkbox" ng-model="nonceDisabled" ng-change="nonceGenChange()">
                            </label>
                            <input type="text" class="form-control" required name="nonce" id="nonce"
                                ng-model="$ctrl.nonce" ng-disabled="nonceDisabled" ng-change="formSignature()">
                            <span ng-show="authParamsForm.nonce.$touched && authParamsForm.nonce.$invalid" class="fail">
                                Nonce is required.
                            </span>
                        </div>
                    </div>

                    <br>

                    <div class="row" ng-if="$ctrl.selectedLevel === 2">
                        <div class="col-sm-12">
                            <div class="row">
                                <div class="col-sm-12">
                                    <label for="pem">Pem File</label>
                                    <small>
                                        Load pem file: <input type="file" on-read-file="parseInputFile($fileContents)" style="display:inline">
                                    </small>
                                </div>                              
                            </div>

                            <div class="row">
                                <div class="col-md-12">
                                    <textarea rows="10" cols="65" class="form-control code" name="pem" id="pem" required
                                        ng-model="$ctrl.pem" ng-change="formSignature()">
                                    </textarea>
                                    <span ng-show="authParamsForm.pem.$touched && authParamsForm.pem.$invalid" class="fail">
                                        Pem string is required.
                                    </span>
                                </div>
                            </div>

                            <br>

                            <div class="row">
                                <div class="col-md-12">
                                    <label for="pkeySecret">Password for private key (if encrypted)</label>
                                    <input type="password" class="form-control" name="pkeySecret" id="pkeySecret"
                                            ng-model="$ctrl.pkeySecret" ng-change=formSignature()>
                                    <p ng-if="privateKeyError" class="fail">{{ config.main.errorMessages.pkeyInvalid }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>  
            </div>
        </div>
    </div>
</div>

<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-12" style="text-align:center">
                <h4><span class="label label-primary">3</span> Signature base string and headers</h4>
                <!-- <button type="button" class="btn btn-default" ng-if="$ctrl.selectedLevel === 1 || $ctrl.selectedLevel === 2" 
                        ng-click="$ctrl.showBasestring = true; $ctrl.showAuthHeader = true">
                    <span class="glyphicon glyphicon-eye-open"></span> Show Basestring and Header
                </button> -->
            </div>
        </div> 
    </div>

    <div class="panel-body">
        <div class="row" style="text-align:center">
            <div class="col-sm-12" ng-if="$ctrl.selectedLevel === 0">
                <strong>No authentication required for L0</strong>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-12" ng-if="$ctrl.selectedLevel === 1 || $ctrl.selectedLevel === 2">
                <div ng-if="!$ctrl.signatureGenerated()" style="text-align:center">
                    <strong>
                        Fill in all fields to generate base string and authorization header.
                    </strong>
                </div>
                
                <div class="jumbotron" ng-if="$ctrl.signatureGenerated()">
                    <div class="row">
                        <div class="col-md-12">
                            <label for="basestring">Generated base string</label>
                            <textarea rows="4" disabled class="form-control immutable code" ng-model="$ctrl.basestring" name="basestring" id="basestring"></textarea>
                        </div>
                    </div>                

                    <div class="row">
                        <div class="col-md-12">
                            <label for="basestringToCompare">Base string to Compare</label>
                            <textarea rows="4" class="form-control code" ng-model="$ctrl.basestringToCompare" name="basestringToCompare" id="basestringToCompare"></textarea>
                        </div>
                    </div>
                
                    <div class="row" ng-if="$ctrl.showBasestringComparison">
                        <br>
                        <div class="col-md-12">
                            <label>Comparison Results</label>
                            <pre ng-bind-html="$ctrl.basestringComparison"></pre>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-12">
                            <span style="float:right; margin-top:5px">
                                <button class="btn btn-default" ng-click="$ctrl.compareBasestring($ctrl.basestring, $ctrl.basestringToCompare)">Compare Base Strings</button>
                            </span>
                        </div>
                    </div>
            
                    <div class="row">
                        <div class="col-md-12">
                            <label for="authHeader">Request Authorization Header</label>
                            <textarea rows="6" class="form-control immutable code" name="authHeader" id="authHeader"
                                ng-model="$ctrl.authHeader" disabled></textarea>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-12">
                            <span style="float:right; margin-top:5px">
                                <button class="btn btn-default" ng-click="formSignature()">Regenerate Base String And Signature</button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div style='text-align:center'>
    <button type="button" class="btn btn-lg btn-default" ng-click="$ctrl.sendTestRequest()" ng-disabled="!$ctrl.canSendTestRequest()">
        <span class="glyphicon glyphicon-transfer"></span> Send Test Request
    </button>
</div>

<br>

<div class="panel panel-default" ng-if="$ctrl.apiTest">
    <div class="panel-heading">
        <div class="row" style='text-align:center'>
            <div class="col-sm-12">
                <strong>API Test Response</strong>
            </div>
        </div>
    </div>
    <div class="panel-body" ng-class="{'bg-success': $ctrl.apiTest.status < 300, 'bg-warning': 300 <= $ctrl.apiTest.status && $ctrl.apiTest.status < 400, 'bg-danger': (400 <= $ctrl.apiTest.status && $ctrl.apiTest.status < 600) || $ctrl.apiTest.status === -1}">
        <div ng-if="$ctrl.sendingTestRequest" class="spinner">
            <div class="bounce1"></div>
            <div class="bounce2"></div>
            <div class="bounce3"></div>
        </div>

        <div class="row">
            <div class="col-sm-12">
                <label for="apiTestConfig">API Test Request Config </label> 
                <textarea rows="4" name=apiTestConfig" id="apiTestConfig" class="form-control code" disabled>{{ $ctrl.apiTest.config.method }} {{ $ctrl.apiTest.config.url }}
{{ $ctrl.getApiTestHeaders($ctrl.apiTest.config.headers) }}
                </textarea>

                <br>
            
                <strong>API Test Request Status:</strong> {{ $ctrl.apiTest.xhrStatus }}<span ng-if="$ctrl.apiTest.xhrStatus === 'error'">: the http request could not be completed</span>

                <br>

                <strong>API Test Response Status:</strong> {{ $ctrl.apiTest.status }} {{ $ctrl.apiTest.statusText }}

                <br>

                <label for="apiTestResponse">API Test Response Data</label>
                <textarea rows="4" name="apiTestResponse" id="apiTestResponse" class="form-control code" disabled>{{$ctrl.apiTest.data | json}}</textarea>
            </div>            
        </div>
    </div>
</div>
</div>`;

function signatureValidatorController($scope, config, Notification, TestService, $sce, $uibModal) {
    const controller = this;

    init();

    $scope.config = config;

    controller.addPostBody = addPostBody;
    controller.authPrefix = authPrefix;
    controller.canSendTestRequest = canSendTestRequest;
    controller.compareBasestring = compareBasestring;
    controller.changeAuthLevel = changeAuthLevel;
    controller.getApiTestHeaders = getApiTestHeaders;
    controller.formSignatureUrl = formSignatureUrl;
    controller.onToggleCustomSignatureUrl = onToggleCustomSignatureUrl;
    controller.removePostBody = removePostBody;
    controller.sendTestRequest = sendTestRequest;
    controller.signatureMethod = signatureMethod;
    controller.signatureGenerated = signatureGenerated;
    controller.showOptions = showOptions;

    $scope.formSignature = formSignature; // Main signature generation function
    $scope.nonceGenChange = nonceGenChange;
    $scope.timestampGenChange = timestampGenChange;
    $scope.parseInputFile = parseInputFile;

    function init() {
        controller.postBody = [];

        controller.sendingTestRequest = false;
        $scope.nonceDisabled = true;
        $scope.timestampDisabled = true;

        controller.timestamp = 'auto-generated';
        controller.nonce = 'auto-generated';

        controller.selectedLevel = 0;

        controller.apiUrl = '';

        $scope.httpMethods = config.main.httpMethods;
        controller.httpMethod = $scope.httpMethods[0];

        $scope.gatewayZoneOptions = config.main.providerGateway;
        controller.gatewayZone = $scope.gatewayZoneOptions[0];

        controller.authLevels = config.main.authLevels;

        controller.appVersion = config.main.appVersion;
    }

    function signatureMethod() {
        switch (controller.selectedLevel) {
            case 0:
                return '';
            case 1:
                return config.main.sigMethod.level1;
            case 2:
                return config.main.sigMethod.level2;
        }
    }

    function changeAuthLevel(level) {
        controller.selectedLevel = level;
        controller.apiTest = null;
        formSignature();
    }

    function authPrefix() {
        if (controller.gatewayZone === config.constants.gatewayZones.internet) {
            switch (controller.selectedLevel) {
                case 1:
                    return 'apex_l1_eg';
                case 2:
                    return 'apex_l2_eg';
                default:
                    return '';
            }
        } else if (controller.gatewayZone === config.constants.gatewayZones.intranet) {
            switch (controller.selectedLevel) {
                case 1:
                    return 'apex_l1_ig';
                case 2:
                    return 'apex_l2_ig';
                default:
                    return '';
            }
        }
    }

    function addPostBody(key, value) {
        controller.postBody.push({
            key: key,
            value: value
        });
    }

    function canSendTestRequest() {
        if (controller.selectedLevel === 0) {
            return controller.apiUrl && controller.apiUrl.length > 0;
        } else {
            return controller.basestring && controller.authHeader;
        }
    }

    function onToggleCustomSignatureUrl() {
        if (!controller.customSignatureUrl) {
            controller.formSignatureUrl();
            formSignature();
        }
    }

    function formSignatureUrl() {
        if (controller.customSignatureUrl) return;
        if (controller.apiUrl === '' || !controller.apiUrl) return '';

        let apexDomain = controller.apiUrl.indexOf('.api.gov.sg');
        if (apexDomain !== -1) {
            let right = controller.apiUrl.substring(apexDomain);
            let left = controller.apiUrl.substring(0, apexDomain);
            let domainIdentifier = controller.gatewayZone === config.constants.gatewayZones.internet ? 'e' : 'i';
            controller.signatureUrl = `${left}.${domainIdentifier}${right}`;
        } else { controller.signatureUrl = controller.apiUrl; }
    }

    function removePostBody(index) {
        controller.postBody.splice(index, 1);
        formSignature();
    }

    function formSignature() {
        if (controller.selectedLevel === 0) return;
        controller.showBasestringComparison = false;
        let valid = validateForm(controller.selectedLevel);
        if (valid) {
            let basestringOptions = {
                signatureUrl: controller.signatureUrl,
                authPrefix: authPrefix(),
                signatureMethod: signatureMethod(),
                appId: controller.appId,
                httpMethod: controller.httpMethod,
                appVersion: config.main.appVersion,
                // Optional parameters
                nonce: controller.nonce === 'auto-generated' ? randomBytes(32).toString('base64') : controller.nonce,
                timestamp: controller.timestamp === 'auto-generated' ? (new Date).getTime() : controller.timestamp,
                queryString: controller.queryString                
            };
            // Process POST (x-www-form-urlencoded body)
            if (controller.postBody.length > 0) {
                basestringOptions.formData = controller.postBody.reduce((finalObject, currentObject) => {
                    finalObject[currentObject.key] = currentObject.value;
                    return finalObject;
                }, {});
            }

            controller.basestring = TestService.generateBasestring(basestringOptions);

            // 2. Signature generation
            let key;
            $scope.privateKeyError = false;
            if (controller.selectedLevel === 1) {
                key = controller.appSecret;
            } else if (controller.selectedLevel === 2) {
                try {
                    key = KJUR.KEYUTIL.getKey(controller.pem, controller.pkeySecret);
                } catch (exception) {
                    $scope.privateKeyError = true;
                    controller.basestring = '';
                    controller.authHeader = '';
                    Notification.error({
                        title: '',
                        message: config.main.errorMessages.pkeyInvalid,
                        delay: config.notificationShowTime
                    });
                }
            }
            let signature = TestService.signBasestring(controller.selectedLevel, controller.basestring, key);
            let authHeader = TestService.genAuthHeader(basestringOptions, signature);
            controller.authHeader = authHeader;
        } else if (signatureGenerated()) {
            controller.basestring = '';
            controller.authHeader = '';
        }
    }

    /**
     * Checks whether all necessary inputs are present
     * @param {number} level Apex auth level
     * @returns {boolean} true if form is valid, false otherwise
     */
    function validateForm(level) {
        switch (level) {
            case 0:
                return controller.apiUrl && controller.apiUrl.length > 0;
            case 1:
                return controller.apiUrl && controller.apiUrl.length > 0 &&
                    controller.appId && controller.appId.length > 0 &&
                    controller.appSecret && controller.appSecret.length > 0 &&
                    controller.nonce && controller.nonce.length > 0 &&
                    controller.timestamp && controller.timestamp.length > 0;
            case 2:
                return controller.apiUrl && controller.apiUrl.length > 0 &&
                    controller.appId && controller.appId.length > 0 &&
                    controller.pem && controller.pem.length > 0 &&
                    controller.nonce && controller.nonce.length > 0 &&
                    controller.timestamp && controller.timestamp.length > 0;
        }
    }

    function signatureGenerated() {
        return controller.basestring && controller.basestring.length > 0 && controller.authHeader && controller.authHeader.length > 0;
    }

    function compareBasestring(generated, input) {
        if (input == null) {
            input = '';
        }
        controller.showBasestringComparison = true;
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
        controller.basestringComparison = $sce.trustAsHtml(bsResults);
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
        return TestService.sendTestRequest(controller.apiUrl, controller.httpMethod, controller.authHeader, controller.selectedLevel)
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
                formSignature();
                controller.sendingTestRequest = false;
            });
    }

    function nonceGenChange() {
        $scope.nonceDisabled = !$scope.nonceDisabled;
        if ($scope.nonceDisabled) {
            controller.nonce = 'auto-generated';
        } else {
            controller.nonce = '';
        }
        formSignature();
    }

    function timestampGenChange() {
        $scope.timestampDisabled = !$scope.timestampDisabled;
        if ($scope.timestampDisabled) {
            controller.timestamp = 'auto-generated';
        } else {
            controller.timestamp = '';
        }
        formSignature();
    }

    function parseInputFile(fileText) {
        controller.pem = fileText;
        formSignature();
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
            gatewayZone: controller.gatewayZone,
            httpMethod: controller.httpMethod,
            apiUrl: controller.apiUrl,
            signatureUrl: controller.signatureUrl,
            selectedLevel: controller.selectedLevel,
            appId: controller.appId,
            appSecret: controller.appSecret,
            nonce: controller.nonce,
            timestamp: controller.timestamp
        };
        if (controller.httpMethod === 'POST' && controller.postBody.length > 0) {
            // Need to map each parameter to get rid of angularjs internal $$hashkeys
            currentConfig.postBody = controller.postBody.map(kvpair => {
                return {
                    key: kvpair.key,
                    value: kvpair.value
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
            controller[param] = config[param];
        });
        formSignature();
    }

    function getApiTestHeaders(headers) {
        let headerString = '';
        let headerKeys = Object.keys(headers);
        for (let key of headerKeys) {
            headerString += `${key}: ${headers[key]}\n`;
        }
        return headerString;
    }
}

signatureValidatorController.$inject = ['$scope', 'config', 'Notification', 'TestService', '$sce', '$uibModal'];

export default {
    controller: signatureValidatorController,
    template: signatureValidatorTemplate
};