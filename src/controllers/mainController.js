import KJUR from 'jsrsasign';

mainCtrlFunc.$inject = [
    "$scope", "$rootScope", "config", "Notification", "TestService", "ModalService", "$sce"
];

function mainCtrlFunc($scope, $rootScope, config, Notification, TestService, ModalService, $sce) {
    const controller = this;

    init();

    $scope.add = add;
    $scope.remove = remove;
    $scope.formParams = formParams;

    $scope.additionalParams = [];

    $scope.$on('navbar-modal-set', function (event, args) {
        set();
        //update uri preview
        formParams()
    });

    $scope.$on('navbar-modal-clicked', function (event, args) {
        saveInputsToModalService();
        $rootScope.$broadcast('params-saved')
    });

    function init() {
        if (ModalService.getParams() != null) {
            set();
        } else {
            // Initial load
            loadDefaultFromConfig(2);
            $scope.selectedRequest = $scope.options[0];
            $scope.selectedFrom = $scope.options_zone[0];

            $scope.selectedProvider = $scope.options_provider[0];
            // $scope.selectedGateway = config.main.defaultGateway;
            $scope.input_authprefix = config.main.defaultAuthPrefix;
            $scope.input_timestamp = 'auto-generated';
            $scope.input_nonce = 'auto-generated';
            $scope.selectedLevel = 0;
        }
    }

    function set() {
        //populate values
        let savedObject = ModalService.getParams();
        $scope.selectedRequest = savedObject.request;
        $scope.selectedGateway = savedObject.gateway;
        $scope.input_uri = savedObject.path;
        $scope.selectedFrom = savedObject.invoke_from;
        $scope.selectedProvider = savedObject.provider_zone;
        $scope.input_authprefix = savedObject.auth_prefix;
        $scope.input_appId = savedObject.app_id;
        $scope.selectedLevel = savedObject.level;
        controller.input_appSecret = savedObject.app_secret;
        loadDefaultFromConfig(savedObject.level);
        $scope.levelChange();

        if (savedObject.nonce == null) {
            $scope.input_nonce = "auto-generated";
            $scope.nonceDisabled = false;
        } else {
            $scope.input_nonce = savedObject.nonce;
            $scope.nonceDisabled = true;
        }
        if (savedObject.timestamp == null) {
            $scope.input_timestamp = "auto-generated";
            $scope.timestampDisabled = false;
        } else {
            $scope.input_timestamp = savedObject.timestamp;
            $scope.timestampDisabled = true;
        }
        $scope.additionalParams = savedObject.additional_params;
        $scope.pem = ModalService.getPem();
        $scope.privSecret = ModalService.getPwd();
    }

    function loadDefaultFromConfig(level) {
        $scope.options = ['GET', 'POST'];
        $scope.options_zone = config.main.callerZone;
        $scope.options_provider = config.main.providerGateway;
        $scope.input_app_ver = config.main.appVer;
        if (level === 1) {
            $scope.input_sigmethod = config.main.sigMethod.level1
        } else {
            $scope.input_sigmethod = config.main.sigMethod.level2
        }

        $scope.options_level = config.main.authLevels
    }

    function add(name, value) {
        $scope.additionalParams.push(
            {
                name: name,
                value: value
            }
        )
    }

    function remove(index) {
        $scope.additionalParams.splice(index, 1)
    }

    $scope.checkTestResult = function () {
        if ($scope.test || $scope.testSuccess == null)
            return 'test-send';

        if ($scope.testSuccess)
            return 'test-send-success';
        else
            return 'test-send-fail'
    };

    $scope.levelChange = function () {
        $scope.showTestResults = false;
        if ($scope.selectedLevel === 2) {
            $scope.showLevel2 = true;
            $scope.showLevel1 = true;
            $scope.input_sigmethod = config.main.sigMethod.level2
        } else if ($scope.selectedLevel === 1) {
            $scope.showLevel1 = true;
            $scope.showLevel2 = false;
            $scope.input_sigmethod = config.main.sigMethod.level1
        } else {
            $scope.showLevel2 = false;
            $scope.showLevel1 = false;
        }
    };

    $scope.nonceGenChange = function () {
        $scope.nonceDisabled = !$scope.nonceDisabled;
        if (!$scope.nonceDisabled) {
            $scope.input_nonce = 'auto-generated'
        } else {
            $scope.input_nonce = ''
        }
    };

    $scope.timestampGenChange = function () {
        $scope.timestampDisabled = !$scope.timestampDisabled;
        if (!$scope.timestampDisabled) {
            $scope.input_timestamp = 'auto-generated'
        } else {
            $scope.input_timestamp = ''
        }
    };

    function saveInputsToModalService() {
        let paramsToSave = {
            'level': $scope.selectedLevel,
            'request': $scope.selectedRequest,
            'gateway': $scope.selectedGateway,
            'path': $scope.input_uri,
            'invoke_from': $scope.selectedFrom,
            'provider_zone': $scope.selectedProvider,
            'auth_prefix': $scope.input_authprefix,
            'app_id': $scope.input_appId,
            'additional_params': $scope.additionalParams,
            'app_secret': controller.input_appSecret

        };
        if ($scope.nonceDisabled)
            paramsToSave['nonce'] = $scope.input_nonce
        if ($scope.timestampDisabled)
            paramsToSave['timestamp'] = $scope.input_timestamp

        ModalService.setParams(paramsToSave)
        ModalService.setPem($scope.pem)
        ModalService.setPwd($scope.privSecret)
    }

    $scope.compareBS = function (generatedBS, ownBS) {
        showBaseCompareResults(true);
        let before = false;
        let bsResults = "";
        for (let i = 0; i < generatedBS.length; i++) {
            let gen = generatedBS[i];
            let own = ownBS[i]
            if (own == null) {
                let stringToAdd = generatedBS.substr(i, generatedBS.leading);
                bsResults += "<span class='missing-basestring-char'>" + stringToAdd + "</span>";
                break;
            }
            if (gen !== own && !before) {
                own = "<span class='incorrect-basestring-char''>" + own;
                before = true;
            }
            else if (gen === own && before) {
                own = "</span>" + own;
                before = false;
            }
            bsResults += own;
        }
        if (ownBS.length > generatedBS.length) {
            if (before)
                bsResults += "</span>";
            bsResults += "<span class = 'extra-basestring-char'>" + ownBS.substr(generatedBS.length) + "</span>";
        }
        $scope.bsResults = $sce.trustAsHtml(bsResults);
        if (generatedBS === ownBS)
            Notification({
                title: "",
                message: "Basestrings are the same",
                delay: config.notificationShowTime
            }, 'success')
        else
            Notification({
                title: "",
                message: "Basestrings are different",
                delay: config.notificationShowTime
            }, 'error')
    }

    function formUris(realmPartialUri) {
        let gateway = $scope.selectedGateway || '';
        let mid = config.main.domain;
        let front;
        if ($scope.selectedProvider === 'External Gateway') {
            front = 'https://' + gateway;
        } else if ($scope.selectedProvider === 'Internal Gateway' && ($scope.selectedFrom === 'WWW' || $scope.selectedFrom === 'Internet Zone')) {
            front = 'https://' + gateway + '.i';
        } else if ($scope.selectedFrom === 'SGNet') {
            front = 'http://' + gateway + '-pvt.i';
        } else front = 'http://' + gateway + '.i';
        let uri = front + mid;
        if ($scope.input_uri != null) {
            uri += $scope.input_uri;
            realmPartialUri += $scope.input_uri
        }
        $scope.uri = uri;
        $scope.realmUri = realmPartialUri;
        return {
            uri: uri,
            realmUri: realmPartialUri
        }
    }

    function formRealmUri() {
        let append = config.main.domain;
        let url = 'https://' + ($scope.selectedGateway || '');
        if ($scope.selectedFrom === 'Internet Zone') {
            url += '.e'
        } else if ($scope.selectedFrom === 'Intranet Zone') {
            url += '.i'
        } else if ($scope.selectedFrom === 'SGNet') {
            url += '-pvt'
        }
        return url + append
    }

    $scope.parseInputFile = function (fileText) {
        $scope.pem = fileText;
        ModalService.setPem($scope.pem)
    };

    function formParams() {
        let realmUri = formRealmUri();
        let uris = formUris(realmUri);
        let params = {};

        let authPrefix = $scope.input_authprefix || '';

        params['prefix'] = authPrefix.toLowerCase();
        params['request'] = $scope.selectedRequest;
        params['uri'] = uris.uri;
        params['realm'] = uris.realmUri;
        params['app_id'] = $scope.input_appId;
        params['nonce'] = $scope.input_nonce;
        params['signature_method'] = $scope.input_sigmethod;
        params['timestamp'] = $scope.input_timestamp;
        params['version'] = $scope.input_app_ver;

        $scope.params = params;

        let errorMsg = '';

        if ($scope.selectedGateway === '' || $scope.selectedGateway == null) {
            errorMsg += config.main.errorMsgs.noSelectedGateway + '<br>';
        }

        if ($scope.selectedLevel === 1 || $scope.selectedLevel === 2) {
            if (params['app_id'] === '' || params['app_id'] == null) {
                errorMsg += config.main.errorMsgs.noAppId + '<br>'
            }

            if ($scope.app_secret === '' || $scope.app_secret == null) {
                errorMsg += config.main.errorMsgs.noAppSecret + '<br>'
            }

            if (params['timestamp'] === '' || params['timestamp'] == null) {
                errorMsg += config.main.errorMsgs.timestampInvalid + '<br>'
            } else if (!$scope.timestampDisabled) {
                params['timestamp'] = (new Date).getTime()
            }

            if (params['nonce'] === '' || params['nonce'] == null) {
                errorMsg += config.main.errorMsgs.nonceInvalid + '<br>'
            } else if (!$scope.nonceDisabled) {
                params['nonce'] = Math.floor(Math.random() * 100000000000)
            }
        }
        if (errorMsg !== '') {
            throw {
                name: 'Incomplete fields',
                message: errorMsg
            };
        }

        $scope.input_basestring = TestService.generateBasestring(params, $scope.additionalParams)
    }

    function showBaseCompareResults(boolean) {
        $scope.showBaseStringCompareResults = boolean;
    }

    $scope.signAndTest = function (send) {
        $scope.privateKeyError = false;
        showBaseCompareResults(false);
        try {
            formParams();
            let key;
            if ($scope.selectedLevel === 1) {
                key = controller.input_appSecret
            } else if ($scope.selectedLevel === 2) {
                // let test = $scope.pem.substring(
                //     $scope.pem.indexOf(config.sign.beginPrivateRSA),
                //     $scope.pem.indexOf(config.sign.endPrivRSA) + config.sign.endPrivRSA.length
                // );
                try {
                    key = KJUR.KEYUTIL.getKey(
                        $scope.pem.substring(
                            $scope.pem.indexOf(config.sign.beginPrivateRSA),
                            $scope.pem.indexOf(config.sign.endPrivRSA) + config.sign.endPrivRSA.length
                        ),
                        $scope.privSecret
                    )
                } catch (exception) {
                    $scope.privateKeyError = true;
                }
            }
            let sig = TestService.signBasestring($scope.selectedLevel, $scope.input_basestring, key);
            let authHeader = TestService.genAuthHeader($scope.params, sig);
            $scope.testSendAuthHeader = authHeader.substring('Authorization: '.length, authHeader.length - 1);
            $scope.authHeader = authHeader.substring(0, authHeader.length - 1);
            sendTest(send);
        } catch (exception) {
            if (!$scope.paramForm.$valid) {
                Notification({
                    title: exception.name,
                    message: exception.message,
                    delay: config.notificationShowTime
                }, 'warning');
                // set all invalid form fields to $touched
                if ($scope.paramForm.$invalid) {
                    angular.forEach($scope.paramForm.$error, function (field) {
                        angular.forEach(field, function (errorField) {
                            errorField.$setTouched()
                        })
                    })
                }
            }
        }
    };

    function sendTest(sendRequest) {
        if ($scope.selectedLevel === 2) {
            $scope.showBaseString = true;
            $scope.showAuthHeader = true;
        }
        else if ($scope.selectedLevel === 1) {
            $scope.showBaseString = true;
            $scope.showAuthHeader = true;
        }
        else {
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
            $scope.step3Title = "View Generated Basestring and Signature";
            return;
        }
        $scope.step3Title = "Test Request Response";
        $scope.test = false;
        TestService.sendTestRequest($scope.realmUri, $scope.selectedRequest, $scope.testSendAuthHeader,
            $scope.selectedLevel, $scope.input_appId)
            .then(success => {
                $scope.testSuccess = true;
                $scope.responseData = success.data;
                $scope.testResultData = success.data;
                $scope.testResultStatus = success.status;
                $scope.testResultStatusText = success.statusText
            })
            .catch(failed => {
                $scope.testSuccess = false;
                $scope.responseData = '';
                $scope.testResultData = failed.data;
                $scope.testResultStatus = failed.status;
                $scope.testResultStatusText = failed.statusText;
                if (failed.status === -1) {
                    $scope.testResultData = "Endpoint url could not be resolved";
                }
            })
    }
}

export default mainCtrlFunc;