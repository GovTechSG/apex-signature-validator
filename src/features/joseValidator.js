let joseValidatorTemplate = `
<div class="container-fluid main-content">

<h2>Apex JOSE Validator</h2>

    <form name="joseForm">

        <div class="row">
            <div class="col-md-2">
                <label for="jwt-standard">JOSE Standard</label>
                <select ng-options="o as o for o in $ctrl.jwt_standards" ng-model="$ctrl.selectedJWTStandard" 
                        ng-change="$ctrl.clearFields()" class="form-control" id="jwt-standard">
                </select>
            </div>
        </div>

        <hr>

        <div class="row">
            <div class="col-md-12">
                <h4>Verify JWT</h4>
                <label for="jwt-response">JSON serialized JWT response from APEX</label>
                <textarea rows="12" class="form-control code" ng-model="$ctrl.input" id="jwt-response" name="res"
                        placeholder="Paste API response here"  required>
                </textarea>
                <span ng-show="joseForm.res.$touched && joseForm.res.$invalid" class="fail">
                    Response is required.
                </span>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <label for="key-content" ng-if='$ctrl.selectedJWTStandard === "JWS"'>
                    Public Certificate/Key to verify JWT signature
                </label>

                <label for="key-content" ng-if='$ctrl.selectedJWTStandard === "JWE"'>
                    Private Key to decrypt JWT
                </label>
                
                <textarea rows="12" class="form-control code" ng-model="$ctrl.key" id="key-content" name="keycontent"
                        placeholder="Paste or load certificate/key contents here" required>
                </textarea>
                <span ng-show="joseForm.keycontent.$touched && joseForm.keycontent.$invalid" class="fail">
                    Key Content is required.
                </span>
            </div>
        </div>

        <div class="row">
            <div class="col-md-12" style="text-align: center; margin: 5px;">
                <input type="button" value="Verify JWT" class="btn btn-default btn-lg" ng-disabled="joseForm.$invalid"
                        ng-click="$ctrl.verifyJOSE($ctrl.selectedJWTStandard, $ctrl.input, $ctrl.key)">
            </div>
        </div>

        <div class="row>
            <div class="col-md-12">
                <h4>Output</h4>
                <label for="verification-results">Verification results</label>
                <textarea rows="8" class="form-control code" ng-model="$ctrl.output" id="verification-results"
                        placeholder="Parsed Output"></textarea>
            </div>
        </div>
    </form>
</div>`;

function joseValidatorController($scope, JWTService, stateService, Notification) {
    let controller = this;

    stateService.state = 'joseValidator';

    controller.jwt_standards = ['JWS', 'JWE'];
    controller.selectedJWTStandard = controller.jwt_standards[0];
    controller.clearFields = clearFields;
    controller.verifyJOSE = verifyJOSE;

    function clearFields() {
        controller.input = '';
        controller.key = '';
        controller.output = '';
    }

    function verifyJOSE(jwtStandard, input, key) {
        let response = undefined;
        try {
            if (jwtStandard === 'JWS') {
                response = JWTService.verifyJWS(JSON.parse(input), key);
            } else {
                response = JWTService.decryptJWE(JSON.parse(input), key);
            }
            if (response.status === 'Error') {
                throw new Error(response.output);
            }
            Notification.success('Verified');
            controller.output = JSON.stringify(response.output, null, 2);
        } catch (error) {
            controller.output = error.message;
            Notification.error({
                message: error.message
            })
        }
    }
}

joseValidatorController.$inject = ['$scope', 'JWTService', 'stateService', 'Notification'];

export default {
    template: joseValidatorTemplate,
    controller: joseValidatorController
};

joseValidatorController.$inject = ['$scope', 'JWTService', 'stateService', 'Notification'];

export default {
    template: joseValidatorTemplate,
    controller: joseValidatorController
};