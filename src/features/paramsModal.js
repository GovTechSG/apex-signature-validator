let paramsModalTemplate = `
<div class="modal-header">
    <h3 class="modal-title">Parameters Setup</h3>
</div>
<div class="modal-body">
    additionalParams
    Select json file to load:
    <input type="file" on-read-file="parseInputFile($fileContents)"
        class="btn btn-default" style="display:inline-block">
    <br/> <br/>
    <textarea rows="20" cols="65" class="form-control" ng-model="jsonString" ng-keydown="handleTabKey($event)" style="font-family:monospace"></textarea>

</div>
<div class="modal-footer">
    <button class="btn btn-primary" type="button" ng-click="set()">
        <span class="glyphicon glyphicon-ok"></span>
        Okay
    </button>
    <button class="btn btn-primary" type="button" ng-click="downloadJSON()">
        <span class="glyphicon glyphicon-save"></span>
        Save as JSON
    </button>
    <button class="btn btn-danger" type="button" ng-click="cancel()">
        <span class="glyphicon glyphicon-remove"></span>
        Cancel
    </button>
</div>
`

paramsModalController.$inject = ["$scope", "$uibModalInstance", "items"];

function paramsModalController($scope, $uibModalInstance, items) {

    $scope.jsonString = JSON.stringify(items, null, 2);

    $scope.downloadJSON = function () {
        // var paramJson = JSON.stringify(paramsToSave);
        var blob = new Blob([$scope.jsonString], { type: "application/json;charset=utf-8;" });
        var downloadLink = angular.element('<a></a>');
        downloadLink.attr('href', window.URL.createObjectURL(blob));
        downloadLink.attr('download', 'saved-inputs.json');
        downloadLink[0].click();
    };

    $scope.set = function () {
        $uibModalInstance.close($scope.jsonString);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.handleTabKey = function (e) {
        if (e.which === 9) {
            e.preventDefault();
            var start = e.target.selectionStart;
            var end = e.target.selectionEnd;
            $scope.jsonString = $scope.jsonString.substring(0, start) + '\t' + $scope.jsonString.substring(end);
            angular.element(e.target).val($scope.jsonString);
            e.target.selectionStart = e.target.selectionEnd = start + 1;
        }
    };

    $scope.parseInputFile = function (fileText) {
        $scope.jsonString = JSON.stringify(JSON.parse(fileText), null, 2);

        //populate values
        var savedObject = JSON.parse(fileText);
        $scope.selectedRequest = savedObject.request;
        $scope.selectedGateway = savedObject.gateway;
        $scope.input_uri = savedObject.path;
        $scope.selectedFrom = savedObject.invoke_from;
        $scope.selectedProvider = savedObject.provider_zone;
        $scope.input_authprefix = savedObject.auth_prefix;
        $scope.input_appId = savedObject.app_id;
        $scope.input_timestamp = savedObject.timestamp;
        $scope.input_nonce = savedObject.nonce;
        $scope.additionalParams = savedObject.additional_params;
    };
}

export default {
    template: paramsModalTemplate,
    controller: paramsModalController
}
