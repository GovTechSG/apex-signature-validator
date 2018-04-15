import KJUR from 'jsrsasign';
import nonce from 'nonce';

import paramsModal from './paramsModal';

const generateNonce = nonce();

let signatureValidatorTemplate = `
<div class="container-fluid main-content">

<h2>Apex Signature Validator</h2>

<div class="heading">
    <span class="label label-primary">1</span> Input Request Parameters and Generate Basestring
    <span ng-click="$ctrl.showOptions()" style="float: right;">
        <a href><span class="glyphicon glyphicon-cog"></span> Load/save From JSON</a>
    </span>
</div>

<form name="paramForm">

    <div class="row">

        <div class="col-md-6">
            <b>From</b>

            <label class="radio-inline" ng-repeat="single in options_zone">
                <input type="radio" name="from" ng-model="$ctrl.selectedFrom" value="{{single}}" ng-change="formParams()">{{single}}
            </label>
        </div>

        <div class="col-md-6">
            <b>Provider Zone</b>
            <label class="radio-inline" ng-repeat="single in options_provider">
                <input type="radio" name="to" ng-model="$ctrl.selectedProvider" value="{{single}}" ng-change="formParams()">{{single}}
            </label>
        </div>
    </div>
    <br>
    <div class="row">
        <div class="col-md-2">
            <b>Request</b>
            <select ng-options="o as o for o in options" ng-model="selectedRequest" class="form-control"></select>
        </div>

        <div class="col-md-4">
            <b>Gateway</b>

            <input autocomplete="off" class="form-control" placeholder="e.g. my_apex_gateway" ng-model="selectedGateway" name="inputGateway"
                ng-keyup="formParams()" required/>
            <span ng-show="paramForm.inputGateway.$touched && paramForm.inputGateway.$invalid" class="fail">
                Input Gateway is required.
            </span>
        </div>

        <div class="col-md-6">
            <b>Path</b>
            <input type="text" ng-model="input_uri" class="form-control" ng-keyup="formParams()" placeholder="e.g. /v1/rest/level2/ig/ping"
            />
        </div>

    </div>
    <br>

    <div class="row">
        <div class="col-md-12" style="text-align: center">
            <h4>Authentication Level</h4>
            <div class="btn-group">
                <label ng-repeat="level in options_level" class="btn btn-lg btn-default" ng-model="$ctrl.selectedLevel" ng-click="$ctrl.levelChange()"
                    uib-btn-radio="{{level}}">{{level}}
                </label>
            </div>
        </div>
    </div>

    <div>
        <h4>Uri Preview</h4>
        <div class="well uri-preview">
            <b>Endpoint: </b>{{realmUri}}
            <div ng-if="$ctrl.showLevel2 || $ctrl.showLevel1">
                <b>Signing Uri: </b>{{uri}}
                <br>
                <b>Realm Uri: </b>{{realmUri}}
            </div>
        </div>
    </div>


    <hr>
    <h4>Additional Parameters
        <span>
            <button type="button" class="btn btn-default" ng-click="add('','')">
                <span class="glyphicon glyphicon-plus"></span> Add
            </button>
        </span>
    </h4>

    <div>

        <div class="row" ng-repeat="single in additionalParams">

            <div class="col-md-6">
                <b>Name</b>
                <input type="text" class="form-control" ng-model="single.name" uib-tooltip="name of extra parameter" ng-keyup="formParams()"
                    placeholder="name">
            </div>

            <div class="col-md-5">
                <b>Value</b>
                <input type="text" class="form-control" ng-model="single.value" ng-keyup="formParams()" uib-tooltip="value of extra parameter"
                    placeholder="value" />
            </div>

            <div class="col-md-1">
                <br>
                <button type="button" class="btn btn-default" ng-click="remove($index)">
                    <span class="glyphicon glyphicon-remove"></span>
                </button>
            </div>

        </div>
    </div>

    <div class="heading" ng-if="$ctrl.showLevel1 || $ctrl.showLevel2">
        <span class="label label-primary">2</span> Authentication Inputs
        <h4>Required Parameters</h4>
    </div>
    <div class="row">
        <div class="col-md-12">
            <div class="row fx-zoom-normal fx-speed-500" ng-if="$ctrl.showLevel1">
                <div ng-class="{'col-md-6': $ctrl.showLevel2, 'col-md-4' : $ctrl.showLevel1}">
                    <b>Auth Prefix</b>
                    <input type="text" ng-model="$ctrl.input_auth_prefix" class="form-control" name="authPrefix" required ng-keyup="formParams()">
                    <span ng-show="paramForm.authPrefix.$touched && paramForm.authPrefix.$invalid" class="fail">
                        Auth Prefix is required.
                    </span>
                </div>
                <div ng-class="{'col-md-6': $ctrl.showLevel2, 'col-md-4' : !$ctrl.showLevel2}">
                    <b>Application ID</b>
                    <input type="text" ng-model="$ctrl.input_appId" class="form-control" required name="appId" ng-keyup="formParams()">
                    <span ng-show="paramForm.appId.$touched && paramForm.appId.$invalid" class="fail">
                        App Id is required.
                    </span>
                </div>

                <div class="col-md-4" ng-if="!$ctrl.showLevel2">
                    <b>Application Secret</b>
                    <input type="text" ng-model="$ctrl.input_appSecret" required ng-keyup="formParams()" class="form-control" name="appSecret">
                    <span ng-show="paramForm.appSecret.$touched && paramForm.appSecret.$invalid" class="fail">
                        App Secret is required.
                    </span>
                </div>
            </div>

            <br>

            <div ng-if="$ctrl.showLevel2 || $ctrl.showLevel1" class="fx-zoom-normal fx-speed-500">
                <div class="row">
                    <div class="col-md-6">
                        <b>Signature Method</b>
                        <input type="text" class="form-control" ng-model="input_sigmethod" disabled>
                    </div>

                    <div class="col-md-6">
                        <b>App Version</b>
                        <input type="text" class="form-control" ng-model="input_app_ver" disabled>
                    </div>

                </div>
                <br>
                <div class="row">
                    <div class="col-md-6">
                        <b>Timestamp </b>
                        <label style="float:right">
                            <small>auto-generate:</small>
                            <input type="checkbox" ng-model="timestampDisabled" ng-change="timestampGenChange()">
                        </label>
                        <br/>

                        <input type="text" ng-model="$ctrl.input_timestamp" class="form-control" required ng-disabled="timestampDisabled" name="timestamp">
                        <span ng-show="paramForm.timestamp.$touched && paramForm.timestamp.$invalid" class="fail">
                            Timestamp is required.
                        </span>
                    </div>
                    <div class="col-md-6">
                        <b>Nonce</b>
                        <label style="float:right">
                            <small>auto-generate:</small>
                            <input type="checkbox" ng-model="nonceDisabled" ng-change="nonceGenChange()">
                        </label>

                        <br>

                        <input type="text" ng-model="$ctrl.input_nonce" class="form-control" required name="nonce" ng-disabled="nonceDisabled">
                        <span ng-show="paramForm.nonce.$touched && paramForm.nonce.$invalid" class="fail">
                            Nonce is required.
                        </span>
                    </div>
                </div>

                <br>

            </div>
        </div>
    </div>

    <hr>

    <div ng-if="$ctrl.showLevel2">
        <h4>Pem File
            <small>
                Load pem file: <input type="file" on-read-file="parseInputFile($fileContents)" style="display:inline">
            </small>
        </h4>
        <div class="row">
            <div class="col-md-12">
                <br>
                <textarea rows="10" cols="65" class="form-control code" ng-model="$ctrl.pem" name="pem" required></textarea>
                <br>
                <span ng-show="paramForm.pem.$touched && paramForm.pem.$invalid" class="fail">
                    Pem string is required.
                </span>
            </div>
            <div class="col-md-12">
                <b>Secret for Private Key</b>
                <input type="password" class="form-control" ng-model="privSecret">
                <span ng-if="privateKeyError" class="fail">Please verify that both pem string and secret are correct</span>
                <br>
            </div>
        </div>
    </div>

    <div class="row" style='text-align:center'>
        <button type="button" class="btn btn-lg btn-default" ng-click="signAndTest(true)">
            <span class="glyphicon glyphicon-transfer"></span> Send Test Request
        </button>

        <button type="button" class="btn btn-lg btn-default" ng-click="signAndTest(false)" ng-if="$ctrl.showLevel2 || $ctrl.showLevel1">
            <span class="glyphicon glyphicon-eye-open"></span> Show Basestring and Header
        </button>
    </div>
</form>

<div ng-if="showTestResults">
    <div class="heading">
        <span class="label label-primary">3</span>
        {{step3Title}}
    </div>

    <div ng-if="sendingTestRequest" class="spinner">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
    </div>

    <div ng-if="!sendingTestRequest" class="jumbotron" ng-class="checkTestResult()">
        <div ng-if="showBaseString">

            <div class="row">

                <div class="col-md-12">
                    <h4>Generated Basestring:</h4>
                    <textarea rows="3" disabled class="form-control immutable code" ng-model="input_basestring"></textarea>
                </div>
                <div class="col-md-12">
                    <h4>Basestring to Compare:</h4>

                    <textarea rows="3" class="form-control code" ng-model="input_basestring_tocompare"></textarea>
                </div>
                <div class="col-md-12 fx-fade-normal" ng-if="showBaseStringCompareResults">
                    <h4>Comparison Results</h4>
                    <pre ng-bind-html="bsResults"></pre>

                </div>
                <div class="col-md-12">
                    <span style="float:right; margin-top:5px">
                        <input type="button" value="Compare Basestrings" class="btn btn-default" ng-click="compareBS(input_basestring, input_basestring_tocompare)">
                    </span>
                </div>
            </div>
        </div>

        <div ng-if="showAuthHeader">
            <h4>Request Auth Header:</h4>
            <textarea rows="10" ng-model="authHeader" disable class="form-control immutable code" disabled></textarea>
        </div>

        <div style="text-align: center" ng-if="!sendingTestRequest">
            <span ng-if="testResultStatus!==undefined">
                <b>Response:</b>
            </span>
            <span ng-cloak ng-bind="testResultStatus"></span>
            <br/>
            <span ng-if="testResultStatusText!==undefined">
                <b>Status:</b>
            </span>
            <span ng-cloak ng-bind="testResultStatusText"></span>
            <br/>
            <span ng-if="testResultData!==undefined">
                <b>Data:</b>
            </span>
            <span class="wrap" ng-cloak ng-bind="testResultData"></span>
        </div>
    </div>
</div>
</div>`;

function signatureValidatorController($scope, $rootScope, config, Notification, TestService, ModalService, $sce,
                                      $uibModal, stateService) {

    const controller = this;

    stateService.state = 'signatureValidator';

    init();

    $scope.sendingTestRequest = false;

    $scope.additionalParams = [];
    $scope.extractedParams = [];

    $scope.add = add;
    $scope.compareBS = compareBS;
    $scope.remove = remove;
    $scope.formParams = formParams;
    controller.levelChange = levelChange;
    controller.showOptions = showOptions;
    $scope.signAndTest = signAndTest;

    $scope.checkTestResult = function() {
        if ($scope.test || $scope.testSuccess == null) {
            return 'test-send';
        }

        if ($scope.testSuccess) {
            return 'test-send-success';
        } else {
            return 'test-send-fail';
        }
    };

    $scope.nonceGenChange = function() {
        $scope.nonceDisabled = !$scope.nonceDisabled;
        if ($scope.nonceDisabled) {
            controller.input_nonce = 'auto-generated';
        } else {
            controller.input_nonce = '';
        }
    };

    $scope.timestampGenChange = function() {
        $scope.timestampDisabled = !$scope.timestampDisabled;
        if ($scope.timestampDisabled) {
            controller.input_timestamp = 'auto-generated';
        } else {
            controller.input_timestamp = '';
        }
    };

    $scope.parseInputFile = function(fileText) {
        controller.pem = fileText;
        ModalService.setPem(controller.pem);
    };

    function showOptions() {
        saveInputsToModalService();
        $uibModal.open({
            animation: true,
            backdrop: false,
            template: paramsModal.template,
            controller: paramsModal.controller,
            size: 'lg',
            resolve: {
                items: getKeyValues()
            }
        }).result
            .then(function(jsonString) {
                let jsonObj = JSON.parse(jsonString);
                ModalService.setParams(jsonObj.params);
                ModalService.setPem(jsonObj.pem);
                ModalService.setPwd(jsonObj.password);

                set();
                formParams();
            })
            .catch(function() {
            });
    }

    function getKeyValues() {
        return {
            params: ModalService.getParams(),
            password: ModalService.getPwd()
        };
    }

    function init() {
        if (ModalService.getParams() != null) {
            set();
        } else {
            // Initial load

            // $scope.selectedGateway = config.main.defaultGateway;
            // $scope.input_uri = config.main.defaultUri;

            loadDefaultFromConfig(2);
            $scope.selectedRequest = $scope.options[0];
            controller.selectedFrom = $scope.options_zone[0];
            controller.selectedProvider = $scope.options_provider[0];
            controller.input_auth_prefix = config.main.defaultAuthPrefix;
            $scope.nonceDisabled = true;
            $scope.timestampDisabled = true;
            controller.input_timestamp = 'auto-generated';
            controller.input_nonce = 'auto-generated';
            controller.selectedLevel = 0;
        }
        formUris(formRealmUri());
    }

    function set() {
        //populate values
        let savedObject = ModalService.getParams();
        $scope.selectedRequest = savedObject.request;
        $scope.selectedGateway = savedObject.gateway;
        $scope.input_uri = savedObject.path;
        controller.selectedFrom = savedObject.invoke_from;
        controller.selectedProvider = savedObject.provider_zone;
        controller.input_auth_prefix = savedObject.auth_prefix;
        controller.input_appId = savedObject.app_id;
        controller.selectedLevel = savedObject.level;
        controller.input_appSecret = savedObject.app_secret;
        loadDefaultFromConfig(savedObject.level);
        levelChange();

        if (savedObject.nonce == null) {
            controller.input_nonce = 'auto-generated';
            $scope.nonceDisabled = true;
        } else {
            controller.input_nonce = savedObject.nonce;
            $scope.nonceDisabled = false;
        }
        if (savedObject.timestamp == null) {
            controller.input_timestamp = 'auto-generated';
            $scope.timestampDisabled = true;
        } else {
            controller.input_timestamp = savedObject.timestamp;
            $scope.timestampDisabled = false;
        }
        $scope.additionalParams = savedObject.additional_params;
        controller.pem = ModalService.getPem();
        $scope.privSecret = ModalService.getPwd();
    }

    function loadDefaultFromConfig(level) {
        $scope.options = ['GET', 'POST'];
        $scope.options_zone = config.main.callerZone;
        $scope.options_provider = config.main.providerGateway;
        $scope.input_app_ver = config.main.appVer;
        if (level === 1) {
            $scope.input_sigmethod = config.main.sigMethod.level1;
        } else {
            $scope.input_sigmethod = config.main.sigMethod.level2;
        }

        $scope.options_level = config.main.authLevels;
    }

    function showBaseCompareResults(boolean) {
        $scope.showBaseStringCompareResults = boolean;
    }

    function add(name, value) {
        $scope.additionalParams.push({
            name: name,
            value: value
        });
    }

    function remove(index) {
        $scope.additionalParams.splice(index, 1);
    }

    function levelChange() {
        $scope.showTestResults = false;
        if (controller.selectedLevel === 2) {
            controller.showLevel2 = true;
            controller.showLevel1 = true;
            $scope.input_sigmethod = config.main.sigMethod.level2;
        } else if (controller.selectedLevel === 1) {
            controller.showLevel1 = true;
            controller.showLevel2 = false;
            $scope.input_sigmethod = config.main.sigMethod.level1;
        } else {
            controller.showLevel2 = false;
            controller.showLevel1 = false;
        }
    }

    function saveInputsToModalService() {
        let paramsToSave = {
            'level': controller.selectedLevel,
            'request': $scope.selectedRequest,
            'gateway': $scope.selectedGateway,
            'path': $scope.input_uri,
            'invoke_from': controller.selectedFrom,
            'provider_zone': controller.selectedProvider,
            'auth_prefix': controller.input_auth_prefix,
            'app_id': controller.input_appId,
            'additional_params': $scope.additionalParams
        };
        if (controller.selectedLevel === 1) {
            paramsToSave.app_secret = controller.input_appSecret;
        }
        if (!$scope.nonceDisabled) {
            paramsToSave['nonce'] = controller.input_nonce;
        }
        if (!$scope.timestampDisabled) {
            paramsToSave['timestamp'] = controller.input_timestamp;
        }

        ModalService.setParams(paramsToSave);
        ModalService.setPem(controller.pem);
        ModalService.setPwd($scope.privSecret);
    }

    function compareBS(generatedBS, ownBS) {
        if (ownBS == null) {
            ownBS = '';
        }
        showBaseCompareResults(true);
        let before = false;
        let bsResults = '';
        for (let i = 0; i < generatedBS.length; i++) {
            let gen = generatedBS[i];
            let own = ownBS[i];
            if (own == null) {
                let stringToAdd = generatedBS.substr(i, generatedBS.leading);
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
        if (ownBS.length > generatedBS.length) {
            if (before) {
                bsResults += '</span>';
            }
            bsResults += '<span class = \'extra-basestring-char\'>' + ownBS.substr(generatedBS.length) + '</span>';
        }
        $scope.bsResults = $sce.trustAsHtml(bsResults);
        if (generatedBS === ownBS) {

       
            Notification.success({
                title: '',
                message: 'Basestrings are the same',
                delay: config.notificationShowTime
            });
        } else {
            Notification.error({
                title: '',
                message: 'Basestrings are different',
                delay: config.notificationShowTime
            });
        }
    }

    // Strips query params from path
    function stripQueryParams(path) {
        if (path.indexOf('?') !== -1) {
            return path.substring(0, path.indexOf('?'));
        } else {
            return path;
        }
    }

    function formRealmUri() {
        let append = config.main.domain;
        let url = 'https://' + ($scope.selectedGateway || '');
        if (controller.selectedFrom === 'Internet Zone') {
            url += '.e';
        } else if (controller.selectedFrom === 'Intranet Zone') {
            url += '.i';
        } else if (controller.selectedFrom === 'SGNet') {
            url += '-pvt';
        }
        return url + append;
    }

    /**
     *
     * @param {string} realmPartialUri
     * @returns {{uri: string, realmUri: *}}
     */
    function formUris(realmPartialUri) {
        let gateway = $scope.selectedGateway || '';
        let mid = config.main.domain;
        let front;
        if (controller.selectedProvider === 'External Gateway') {
            front = 'https://' + gateway;
        } else if (controller.selectedProvider === 'Internal Gateway' && (controller.selectedFrom === 'WWW' || controller.selectedFrom === 'Internet Zone')) {
            front = 'https://' + gateway + '.i';
        } else if (controller.selectedFrom === 'SGNet') {
            front = 'http://' + gateway + '-pvt.i';
        } else {
            front = 'http://' + gateway + '.i';
        }
        let uri = front + mid;
        if ($scope.input_uri != null) {
            let userPath = $scope.input_uri;
            if (!userPath.startsWith('/')) {
                userPath = '/' + userPath;
            }
            uri += stripQueryParams(userPath);
            realmPartialUri += stripQueryParams(userPath);
        }
        $scope.uri = uri;
        $scope.realmUri = realmPartialUri;
        return {
            uri: uri,
            realmUri: realmPartialUri
        };
    }

    function formFullParams(params, additionalParams) {
        let fullParams = {};
        let keys = Object.keys(params);
        for (let key of keys) {
            if (!['prefix', 'uri', 'realm', 'request'].includes(key)) {
                let prefixKey = params.prefix + '_' + key;
                fullParams[prefixKey] = params[key];
            } else {
                fullParams[key] = params[key];
            }
        }

        //add additional parameters into params object
        for (let i = 0; i < additionalParams.length; i++) {
            if (!(additionalParams[i].name == null || additionalParams[i].name === '') &&
                !(additionalParams[i].value == null || additionalParams[i].value === '')) {
                fullParams[additionalParams[i].name] = additionalParams[i].value;
            }
        }

        return fullParams;
    }

    // Processes all fields on the form and generates base string
    function formParams() {
        let realmUri = formRealmUri();
        let uris = formUris(realmUri);
        let params = {};

        let authPrefix = controller.input_auth_prefix || '';

        params['prefix'] = authPrefix.toLowerCase();
        params['request'] = $scope.selectedRequest;
        params['uri'] = uris.uri;
        params['realm'] = uris.realmUri;
        params['app_id'] = controller.input_appId;
        params['signature_method'] = $scope.input_sigmethod;
        params['version'] = $scope.input_app_ver;

        params.timestamp = controller.input_timestamp === 'auto-generated' ? (new Date).getTime() : controller.input_timestamp;
        params.nonce = controller.input_nonce === 'auto-generated' ? generateNonce() : controller.input_nonce;

        $scope.params = formFullParams(params, $scope.additionalParams.concat($scope.extractedParams));

        $scope.input_basestring = TestService.generateBasestring($scope.params);
    }

    function validateParams() {
        let params = $scope.params;
        let errorMsg = '';

        if ($scope.selectedGateway === '' || $scope.selectedGateway == null) {
            errorMsg += config.main.errorMsgs.noSelectedGateway + '<br>';
        }

        if (controller.selectedLevel === 1 &&
            (controller.input_appSecret === '' || controller.input_appSecret == null)) {
            errorMsg += config.main.errorMsgs.noAppSecret + '<br>';
        }

        if (controller.selectedLevel === 2 &&
            (controller.pem == null || controller.pem === '')) {
            errorMsg += config.main.errorMsgs.noPemProvided;
        }

        if (controller.selectedLevel === 1 || controller.selectedLevel === 2) {
            if (controller.input_auth_prefix === '' || controller.input_auth_prefix == null) {
                errorMsg += config.main.errorMsgs.noAuthPrefix + '<br>';
            }

            if (params[params.prefix + '_app_id'] === '' || params[params.prefix + '_app_id'] == null) {
                errorMsg += config.main.errorMsgs.noAppId + '<br>';
            }

            if (params[params.prefix + '_timestamp'] === '' || params[params.prefix + '_timestamp'] == null) {
                errorMsg += config.main.errorMsgs.timestampInvalid + '<br>';
            }

            if (params[params.prefix + '_nonce'] === '' || params[params.prefix + '_nonce'] == null) {
                errorMsg += config.main.errorMsgs.nonceInvalid + '<br>';
            }
        }

        if (errorMsg !== '') {
            throw {
                name: 'Incomplete fields',
                message: errorMsg
            };
        }
    }

    /**
     *
     * @param {string} input A query string of format key1=value1&key2=value2.
     *
     * @returns {object} An object with key-value pairs taken from the input string.
     */
    function parseQueryString(input) {
        let params = input.split('&');
        let output = {};
        for (let param of params) {
            let outputKeys = Object.keys(output);
            let paramKey = param.substring(0, param.indexOf('='));
            let paramValue = param.substring(param.indexOf('=') + 1);
            if (!outputKeys.includes(paramKey)) {
                // If output doesn't contain key, add it in
                output[paramKey] = paramValue;
            }
        }
        return output;
    }

    function extractQueryParams(path) {
        let search = path.substring(path.indexOf('?') + 1);
        let queryParams = parseQueryString(search);
        let paramNames = Object.keys(queryParams);
        for (let key of paramNames) {
            $scope.extractedParams.push({
                name: key,
                value: queryParams[key]
            });
        }
    }

    function signAndTest(send) {
        $scope.privateKeyError = false;
        showBaseCompareResults(false);
        try {
            // Extract query params, if any, from the give path, before processing params and generating base string
            if ($scope.input_uri.indexOf('?') !== -1) {
                extractQueryParams($scope.input_uri);
            }
            formParams();
            validateParams();
            let key;
            if (controller.selectedLevel === 1) {
                key = controller.input_appSecret;
            } else if (controller.selectedLevel === 2) {
                let keyStart = controller.pem.search(config.sign.beginPrivateKeyHeader);
                let keyEnd = controller.pem.search(config.sign.endPrivateKeyHeader);
                try {
                    key = KJUR.KEYUTIL.getKey(
                        controller.pem.substring(
                            keyStart, 
                            keyEnd + config.sign.endPrivateKeyHeader.toString().length - 2
                        ),
                        $scope.privSecret
                    );
                } catch (exception) {
                    $scope.privateKeyError = true;
                    throw new Error('Please check the validity of your private key.');
                }
            }
            let sig = TestService.signBasestring(controller.selectedLevel, $scope.input_basestring, key);
            let authHeader = TestService.genAuthHeader($scope.params, sig);
            $scope.testSendAuthHeader = authHeader.substring('Authorization: '.length, authHeader.length - 1);
            $scope.authHeader = authHeader.substring(0, authHeader.length - 1);
            sendTest(send);
        } catch (exception) {
            $scope.showTestResults = false;
            Notification.error({
                title: exception.name,
                message: exception.message,
                delay: config.notificationShowTime
            });
            // Set all fields to touched to show errors.
            if ($scope.paramForm.$invalid) {
                angular.forEach($scope.paramForm.$error, function(field) {
                    angular.forEach(field, function(errorField) {
                        errorField.$setTouched();
                    });
                });
            }
        }
    }

    function sendTest(sendRequest) {
        if (controller.selectedLevel === 2) {
            $scope.showBaseString = true;
            $scope.showAuthHeader = true;
        } else if (controller.selectedLevel === 1) {
            $scope.showBaseString = true;
            $scope.showAuthHeader = true;
        } else {
            $scope.showBaseString = false;
            $scope.showAuthHeader = false;
        }

        $scope.showTestResults = true;

        if (!sendRequest) {
            $scope.testResultData = undefined;
            $scope.testResultStatus = undefined;
            $scope.testResultStatusText = undefined;
            $scope.testSuccess = undefined;
            $scope.test = true;
            $scope.step3Title = 'View Generated Basestring and Signature';
            return;
        }

        $scope.step3Title = 'Test Request Response';
        $scope.test = false;

        $scope.sendingTestRequest = true;
        return TestService.sendTestRequest($scope.realmUri, $scope.selectedRequest, $scope.testSendAuthHeader,
            controller.selectedLevel)
            .then(success => {
                $scope.testSuccess = true;
                $scope.responseData = success.data;
                $scope.testResultData = success.data;
                $scope.testResultStatus = success.status;
                $scope.testResultStatusText = success.statusText;
            })
            .catch(failed => {
                $scope.testSuccess = false;
                $scope.responseData = '';
                $scope.testResultData = failed.data;
                $scope.testResultStatus = failed.status;
                $scope.testResultStatusText = failed.statusText;
                if (failed.status === -1) {
                    $scope.testResultData = config.main.errorMsgs.httpReqError;
                }
            })
            .finally(() => {
                $scope.sendingTestRequest = false;
            });
    }
}

signatureValidatorController.$inject = ['$scope', '$rootScope', 'config', 'Notification', 'TestService', 'ModalService', '$sce',
    '$uibModal', 'stateService'
];

export default {
    controller: signatureValidatorController,
    template: signatureValidatorTemplate
};