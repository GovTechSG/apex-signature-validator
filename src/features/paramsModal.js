let paramsModalTemplate = `
<div class="modal-header">
    <h3 class="modal-title">Save or load configuration</h3>
</div>
<div class="modal-body">
    <label for="currentConfigString">Select JSON configuration file to load:</label>
    <input type="file" on-read-file="parseInputFile($fileContents)" style="display:inline-block">
    <textarea rows="20" cols="65" name="currentConfigString" id="currentConfigString" class="form-control code" ng-model="$ctrl.currentConfigString"></textarea>
</div>
<div class="modal-footer" style="justify-content:space-between">
    <span>
        <button class="btn btn-primary" type="button" ng-click="saveConfigAsJson()">
            <i class="fas fa-save"></i>
            Save as JSON
        </button>
    </span>
    
    <span ng-if="$ctrl.currentConfig.selectedLevel === 1" class="fail" style="">Warning! App secret will be saved in this config.</span>

    <span>
        <button class="btn btn-primary" type="button" ng-click="set()">
            <span class="glyphicon glyphicon-ok"></span>
            Set current config
        </button>
        
        <button class="btn btn-danger" type="button" ng-click="cancel()">
            <span class="glyphicon glyphicon-remove"></span>
            Cancel
        </button>
    </span>
    
</div>`;

function paramsModalController($scope, $uibModalInstance, currentConfig) {
    const controller = this;

    // Initialization
    controller.currentConfig = currentConfig;
    controller.currentConfigString = JSON.stringify(currentConfig, null, 2);

    $scope.saveConfigAsJson = function() {
        let blob = new Blob([controller.currentConfigString], {
            type: 'application/json;charset=utf-8;'
        });
        let downloadLink = angular.element('<a></a>');
        downloadLink.attr('href', window.URL.createObjectURL(blob));
        downloadLink.attr('download', 'savedInputs.json');
        downloadLink[0].click();
    };

    $scope.set = function() {
        $uibModalInstance.close(JSON.parse(controller.currentConfigString));
    };

    $scope.cancel = function() {
        $uibModalInstance.dismiss('cancelled');
    };

    $scope.parseInputFile = function(fileText) {
        controller.currentConfigString = JSON.stringify(JSON.parse(fileText), null, 2);
    };
}

paramsModalController.$inject = ['$scope', '$uibModalInstance', 'currentConfig'];

export default {
    template: paramsModalTemplate,
    controller: paramsModalController
};