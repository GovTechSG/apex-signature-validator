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
                        <input type="radio" name="gatewayZoneOptions" ng-model="$ctrl.gatewayZone" value="{{gatewayZone}}" ng-change="formSignature()">
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

                    <input type="text" autocomplete="off" class="form-control" ng-model="$ctrl.apiUrl"
                        name="apiUrl" id="apiUrl" ng-change="formSignature()" required
                        placeholder="https://mygateway.api.gov.sg/myservice/api/v1/users">
                    
                    <span ng-show="httpRequestForm.apiUrl.$touched && httpRequestForm.apiUrl.$invalid" class="fail">
                        API URL is required.
                    </span>
                </div>
            </div>

            <br>

            <div class="row" ng-if="$ctrl.httpMethod === 'POST'">
                <div class="col-md-12">
                    <b>POST body (only if POST body encoding is application/x-www-form-urlencoded)</b> <a href ng-click=$ctrl.addPostBody('','')> <span class="glyphicon glyphicon-plus"></span>Add</a>        
                </div>
            </div>

            <fieldset class="form-horizontal" ng-if="$ctrl.postBody">
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
            
            <div class="well uri-preview">
                <div class="row">
                    <div class="col-sm-12">
                        <strong>Signature URL</strong> <span class="glyphicon glyphicon-info-sign" tooltip-placement="top" uib-tooltip="{{ config.constants.strings.signatureUrl }}"></span>: {{ $ctrl.getSignatureUrl($ctrl.apiUrl) }}
                    </div>
                </div>       
            </div>
        </form>
    </div>
</div>

<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-12" style="text-align:center">
                <h4><span class="label label-primary">2</span> Apex Authentication Level</h4>
                <div class="btn-group">
                    <button ng-repeat="level in $ctrl.authLevels" class="btn btn-default" 
                        ng-click="$ctrl.selectedLevel = level" ng-class="{active: $ctrl.selectedLevel === level}">
                        {{level}}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="panel-body">
        <div class="row">
            <div class="col-sm-12" ng-if="$ctrl.selectedLevel === 0">
                <strong style="text-align:center">No authentication required for L0</strong>
            </div>
            <div class="col-sm-12 "  ng-if="$ctrl.selectedLevel === 1 || $ctrl.selectedLevel === 2">
                <form name="authParamsForm">
                    <h4 style="text-align:center">Required Parameters For L{{$ctrl.selectedLevel}} Authentication</h4>

                    <div class="row">
                        <div ng-class="{'col-md-6': $ctrl.selectedLevel === 2, 'col-md-4': $ctrl.selectedLevel === 1}">
                            <label for="authPrefix">Auth Prefix</label>

                            <input type="text" class="form-control" name="authPrefix" id="authPrefix" required disabled
                                ng-model="$ctrl.getAuthPrefix($ctrl.gatewayZone, $ctrl.selectedLevel)" 
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

                            <input type="text"name="appSecret" id="appSecret" required class="form-control"
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
                            <label for="basestring">Generated Basestring</label>
                            <textarea rows="3" disabled class="form-control immutable code" ng-model="$ctrl.basestring" name="basestring" id="basestring"></textarea>
                        </div>
                    </div>

                    <br>

                    <div class="row">
                        <div class="col-md-12">
                            <label for="basestringToCompare">Basestring to Compare</label>
                            <textarea rows="3" class="form-control code" ng-model="$ctrl.basestringToCompare" name="basestringToCompare" id="basestringToCompare"></textarea>
                        </div>
                    </div>

                    <br>
                
                    <div class="row">
                        <div class="col-md-12" ng-if="$ctrl.showBasestringComparison">
                            <label>Comparison Results</label>
                            <pre ng-bind-html="$ctrl.basestringComparison"></pre>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-12">
                            <span style="float:right; margin-top:5px">
                                <button class="btn btn-default" ng-click="$ctrl.compareBasestring($ctrl.basestring, $ctrl.basestringToCompare)">Compare Basestrings</button>
                            </span>
                        </div>
                    </div>
            
                    <div class="row">
                        <div class="col-md-12">
                            <label for="authHeader">Request Authorization Header</label>
                            <textarea rows="10" class="form-control immutable code" name="authHeader" id="authHeader"
                                ng-model="$ctrl.authHeader" disabled></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div style='text-align:center'>
    <button type="button" class="btn btn-lg btn-default" ng-click="$ctrl.sendTestRequest()">
        <span class="glyphicon glyphicon-transfer"></span> Send Test Request
    </button>
</div>

<br>

<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row" style='text-align:center'>
            <div class="col-sm-12">
                <strong>API Test Response</strong>
            </div>
        </div>
    </div>
    <div class="panel-body" ng-class="{'bg-success': $ctrl.apiTest.status < 300, 'bg-warning': 300 < $ctrl.apiTest.status && $ctrl.apiTest.status < 400, 'bg-danger': (400 < $ctrl.apiTest.status && $ctrl.apiTest.status < 600) || $ctrl.apiTest.status === -1}">
        <div ng-if="$ctrl.sendingTestRequest" class="spinner">
            <div class="bounce1"></div>
            <div class="bounce2"></div>
            <div class="bounce3"></div>
        </div>

        <div class="row">
            <div class="col-sm-12">
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


<div style="text-align: center">
    <span>
        <b>Response:</b>
    </span>
    <span ng-cloak ng-bind="testResultStatus"></span>
    <br/>
    <span>
        <b>Status:</b>
    </span>
    <span ng-cloak ng-bind="testResultStatusText"></span>
    <br/>
    <span>
        <b>Data:</b>
    </span>
    <span class="wrap" ng-cloak ng-bind="testResultData"></span>
</div>

<div class="row">
    <div class="col-sm-12">
        <div ng-if="sendingTestRequest" class="spinner">
            <div class="bounce1"></div>
            <div class="bounce2"></div>
            <div class="bounce3"></div>
        </div>
    </div>
</div>

<form name="paramForm">
    <div class="row">
        <div class="col-md-12" style="text-align: center">
            <h4>Authentication Level</h4>
            <div class="btn-group">
                <label ng-repeat="level in $ctrl.authLevels" class="btn btn-lg btn-default" ng-model="$ctrl.selectedLevel" ng-click="$ctrl.levelChange()"
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
                <input type="text" class="form-control" ng-model="single.name" uib-tooltip="name of extra parameter" ng-keyup="formSignature()"
                    placeholder="name">
            </div>

            <div class="col-md-5">
                <b>Value</b>
                <input type="text" class="form-control" ng-model="single.value" ng-keyup="formSignature()" uib-tooltip="value of extra parameter"
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
            <div ng-if="$ctrl.showLevel2 || $ctrl.showLevel1" class="row">
                <div ng-class="{'col-md-6': $ctrl.showLevel2, 'col-md-4': $ctrl.showLevel1}">
                    <b>Auth Prefix</b>
                    <input type="text" ng-model="$ctrl.inputAuthPrefix" class="form-control" name="authPrefix" required ng-keyup="formSignature()">
                    <span ng-show="paramForm.authPrefix.$touched && paramForm.authPrefix.$invalid" class="fail">
                        Auth Prefix is required.
                    </span>
                </div>
                <div ng-class="{'col-md-6': $ctrl.showLevel2, 'col-md-4': $ctrl.showLevel1}">
                    <b>Application ID</b>
                    <input type="text" ng-model="$ctrl.appId" class="form-control" required name="appId" ng-keyup="formSignature()">
                    <span ng-show="paramForm.appId.$touched && paramForm.appId.$invalid" class="fail">
                        App Id is required.
                    </span>
                </div>

                <div class="col-md-4" ng-if="$ctrl.showLevel1">
                    <b>Application Secret</b>
                    <input type="text" ng-model="$ctrl.input_appSecret" required ng-keyup="formSignature()" class="form-control" name="appSecret">
                    <span ng-show="paramForm.appSecret.$touched && paramForm.appSecret.$invalid" class="fail">
                        App Secret is required.
                    </span>
                </div>
            </div>

            <br>

            <div ng-if="$ctrl.showLevel2 || $ctrl.showLevel1" class="">
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

                        <input type="text" ng-model="$ctrl.timestamp" class="form-control" required ng-disabled="timestampDisabled" name="timestamp">
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

                        <input type="text" ng-model="$ctrl.nonce" class="form-control" required name="nonce" ng-disabled="nonceDisabled">
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
                <div class="col-md-12" ng-if="showBaseStringCompareResults">
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

function signatureValidatorController($scope, config, Notification, TestService, ModalService, $sce, $uibModal, stateService) {

    const controller = this;

    init();

    $scope.config = config;

    controller.addPostBody = addPostBody;
    controller.changeLevel = changeLevel;
    controller.compareBasestring = compareBasestring;
    controller.getAuthPrefix = getAuthPrefix;
    controller.getSignatureUrl = getSignatureUrl;
    controller.levelChange = levelChange;
    controller.removePostBody = removePostBody;
    controller.sendTestRequest = sendTestRequest;
    controller.signatureMethod = signatureMethod;
    controller.signatureGenerated = signatureGenerated;
    controller.showOptions = showOptions;

    $scope.add = add;
    $scope.compareBS = compareBS;
    $scope.formSignature = formSignature; // Main signature generation function
    $scope.nonceGenChange = nonceGenChange;
    $scope.timestampGenChange = timestampGenChange;
    $scope.parseInputFile = parseInputFile;
    $scope.remove = remove;
    $scope.signAndTest = signAndTest;

    function init() {
        stateService.state = 'signatureValidator';
        controller.postBody = [];
        $scope.nonceDisabled = true;
        $scope.timestampDisabled = true;
        controller.timestamp = 'auto-generated';
        controller.nonce = 'auto-generated';
        controller.selectedLevel = 2;

        controller.apiUrl = 'https://training.api.lab/apex-dota/api'

        $scope.sendingTestRequest = false;
        $scope.inputUri = '';
        $scope.additionalParams = [];
        $scope.extractedParams = [];

        $scope.httpMethods = config.main.httpMethods;
        controller.httpMethod = $scope.httpMethods[0];

        $scope.gatewayZoneOptions = config.main.providerGateway;
        controller.gatewayZone = $scope.gatewayZoneOptions[0];

        controller.authLevels = config.main.authLevels;

        controller.appVersion = config.main.appVersion;

        controller.inputAuthPrefix = getAuthPrefix(controller.gatewayZone, controller.selectedLevel);

        if (ModalService.getParams() != null) {
            set();
        } else {
            // Initial load
        }
        formRealmUri();
        formUri();
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

    function changeLevel(level) {
        controller.selectedLevel = level;
        controller.inputAuthPrefix = getAuthPrefix(controller.gatewayZone, controller.selectedLevel)
    }

    function getAuthPrefix(gatewayZone, selectedLevel) {
        if (gatewayZone === config.constants.gatewayZones.internet) {
            switch (selectedLevel) {
                case 1:
                    return 'apex_l1_eg';
                case 2:
                    return 'apex_l2_eg';
                default:
                    return '';
            }
        } else if (gatewayZone === config.constants.gatewayZones.intranet) {
            switch (selectedLevel) {
                case 1:
                    return 'apex_l1_ig';
                case 2:
                    return 'apex_l2_ig';
                default:
                    return ''
            }
        }
    }

    function addPostBody(key, value) {
        controller.postBody.push({
            key: key,
            value: value
        })
    }

    function getSignatureUrl(apiUrl) {
        if (apiUrl === '' || !apiUrl) return '';

        let apexDomain = apiUrl.indexOf('.api.gov.sg');
        if (apexDomain !== -1) {
            let right = apiUrl.substring(apexDomain);
            let left = apiUrl.substring(0, apexDomain);
            let domainIdentifier = controller.gatewayZone === config.constants.gatewayZones.internet ? 'e' : 'i';
            return `${left}.${domainIdentifier}${right}`;
        } else return apiUrl;
    }

    function removePostBody(index) {
        controller.postBody.splice(index, 1);
        formSignature();
    }

    function formSignature() {
        controller.showBasestringComparison = false;
        let valid = validateForm(controller.selectedLevel);
        if (valid) {
            // 1. Base string generation
            // Process any POST body data
            let formData = null;
            if (controller.postBody) {
                formData = {};
                controller.postBody.forEach(function(kvpair) {
                    formData[kvpair.key] = kvpair.value;
                })
            }
            let basestringOptions = {
                signatureUrl: getSignatureUrl(controller.apiUrl),
                authPrefix: getAuthPrefix(controller.gatewayZone, controller.selectedLevel),
                signatureMethod: signatureMethod(),
                appId: controller.appId,
                httpMethod: controller.httpMethod,
                appVersion: config.main.appVersion,
                // Optional parameters
                nonce: controller.nonce === 'auto-generated' ? randomBytes(32).toString('base64') : controller.nonce,
                timestamp: controller.timestamp === 'auto-generated' ? (new Date).getTime() : controller.timestamp,
                queryString: controller.queryString,
                formData: controller.postBody
            };
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
            controller.authHeader = `Authorization: ${authHeader}`;
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
        return controller.basestring && controller.basestring.length > 0 && controller.authHeader && controller.authHeader.length > 0
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
        return TestService.sendTestRequest(controller.apiUrl, controller.httpMethod, controller.authHeader, controller.authLevel)
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
            })
    }

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

    function nonceGenChange() {
        $scope.nonceDisabled = !$scope.nonceDisabled;
        if ($scope.nonceDisabled) {
            controller.nonce = 'auto-generated';
        } else {
            controller.nonce = '';
        }
        formSignature();
    };

    function timestampGenChange() {
        $scope.timestampDisabled = !$scope.timestampDisabled;
        if ($scope.timestampDisabled) {
            controller.timestamp = 'auto-generated';
        } else {
            controller.timestamp = '';
        }
        formSignature();
    };

    function parseInputFile(fileText) {
        controller.pem = fileText;
        formSignature();
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
                formSignature();
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

    function set() {
        //populate values
        let savedObject = ModalService.getParams();
        $scope.selectedRequest = savedObject.request;
        $scope.selectedGateway = savedObject.gateway;
        $scope.inputUri = savedObject.path;
        controller.selectedFrom = savedObject.invoke_from;
        controller.selectedProvider = savedObject.provider_zone;
        controller.inputAuthPrefix = savedObject.auth_prefix;
        controller.appId = savedObject.app_id;
        controller.selectedLevel = savedObject.level;
        controller.input_appSecret = savedObject.app_secret;
        loadDefaultFromConfig(savedObject.level);
        levelChange();

        if (savedObject.nonce == null) {
            controller.nonce = 'auto-generated';
            $scope.nonceDisabled = true;
        } else {
            controller.nonce = savedObject.nonce;
            $scope.nonceDisabled = false;
        }
        if (savedObject.timestamp == null) {
            controller.timestamp = 'auto-generated';
            $scope.timestampDisabled = true;
        } else {
            controller.timestamp = savedObject.timestamp;
            $scope.timestampDisabled = false;
        }
        $scope.additionalParams = savedObject.additional_params;
        controller.pem = ModalService.getPem();
        $scope.privSecret = ModalService.getPwd();
    }

    function loadDefaultFromConfig(level) {
        $scope.httpMethods = config.main.httpMethods;
        $scope.options_zone = config.main.callerZone;
        $scope.gatewayZoneOptions = config.main.providerGateway;
        $scope.input_app_ver = config.main.appVersion;
        if (level === 1) {
            $scope.input_sigmethod = config.main.sigMethod.level1;
        } else {
            $scope.input_sigmethod = config.main.sigMethod.level2;
        }

        controller.authLevels = config.main.authLevels;
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
            controller.showLevel1 = false;
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
            'path': $scope.inputUri,
            'invoke_from': controller.selectedFrom,
            'provider_zone': controller.selectedProvider,
            'auth_prefix': controller.inputAuthPrefix,
            'app_id': controller.appId,
            'additional_params': $scope.additionalParams
        };
        if (controller.selectedLevel === 1) {
            paramsToSave.app_secret = controller.input_appSecret;
        }
        if (!$scope.nonceDisabled) {
            paramsToSave['nonce'] = controller.nonce;
        }
        if (!$scope.timestampDisabled) {
            paramsToSave['timestamp'] = controller.timestamp;
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

    /**
     * Strips query string from path, for signing.
     */
    function stripQueryString(path) {
        if (path.indexOf('?') !== -1) {
            return path.substring(0, path.indexOf('?'));
        } else {
            return path;
        }
    }

    /**
     * Removes starting slash '/' from input user path for internal formatting.
     */
    function processUserPath(userPath) {
        if (userPath != null && userPath.startsWith('/')) {
            return userPath.substring(1);
        } else {
            return userPath || '';
        }
    }

    function formRealmUri() {
        let gateway = $scope.selectedGateway || '';
        let domain = config.main.domain;
        let userPath = processUserPath($scope.inputUri);
        $scope.realmUri = `https://${gateway}.${domain}/${userPath}`;
    }

    /**
     * Forms url used for base string generation. Strips query params.
     */
    function formUri() {
        let gateway = $scope.selectedGateway || '';
        let domain = config.main.domain;
        let userPath = stripQueryString(processUserPath($scope.inputUri));

        let uri = '';
        if (process.env.NODE_ENV === 'production') {
            // production work-around
            if (controller.selectedProvider === 'Internet Gateway') {
                uri = `https://${gateway}.e.${domain}`;
            } else if (controller.selectedProvider === 'Intranet Gateway') {
                uri = `https://${gateway}.i.${domain}`;
            }
        } else {
            uri = `https://${gateway}.${domain}`;
        }

        uri += `/${userPath}`;
        $scope.uri = uri;
    }

    function formFullParams(params, additionalParams) {
        let fullParams = {};
        let keys = Object.keys(params);
        for (let key of keys) {
            if (!['request', 'uri', 'realm', 'prefix'].includes(key)) {
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

    /**
     * Processes all fields on the form and generates base string
     */
    // function formSignature() {
    //     formRealmUri(); // Sets $scope.realmUri
    //     formUri(); // Sets $scope.uri

    //     // Extract query params into $scope.extractedParams
    //     $scope.extractedParams = [];
    //     if ($scope.inputUri.indexOf('?') !== -1) {
    //         extractQueryParams($scope.inputUri);
    //     }

    //     let params = {};

    //     let authPrefix = controller.inputAuthPrefix || '';

    //     params['prefix'] = authPrefix.toLowerCase();
    //     params['request'] = $scope.selectedRequest;
    //     params['uri'] = $scope.uri;
    //     params['realm'] = $scope.realmUri;
    //     // Processed in base string
    //     params['app_id'] = controller.appId;
    //     params['signature_method'] = $scope.input_sigmethod;
    //     params['version'] = $scope.input_app_ver;
    //     params.timestamp = controller.timestamp === 'auto-generated' ? (new Date).getTime() : controller.timestamp;
    //     params.nonce = controller.nonce === 'auto-generated' ? generateNonce() : controller.nonce;

    //     $scope.params = formFullParams(params, $scope.additionalParams.concat($scope.extractedParams));

    //     $scope.input_basestring = TestService.generateBasestring($scope.params);
    // }

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
            if (controller.inputAuthPrefix === '' || controller.inputAuthPrefix == null) {
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


    function signAndTest(send) {
        $scope.privateKeyError = false;
        showBaseCompareResults(false);
        try {
            formSignature();
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

signatureValidatorController.$inject = ['$scope', 'config', 'Notification', 'TestService', 'ModalService', '$sce',
    '$uibModal', 'stateService'
];

export default {
    controller: signatureValidatorController,
    template: signatureValidatorTemplate
};