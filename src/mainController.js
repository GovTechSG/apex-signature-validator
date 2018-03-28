import apex_logo from './images/logo_apex.png';

mainController.$inject = ["$scope", "$rootScope", "ModalService", "$uibModal"];

function mainController($scope, $rootScope, ModalService, $uibModal) {
    let controller = this;

    controller.apex_logo = apex_logo; // path to logo file

    $scope.signClick = function () {
        $rootScope.$broadcast('navbar-sign-clicked');
    };

    $scope.modalClick = function () {
        $rootScope.$broadcast('navbar-modal-clicked');
    };

    $scope.$on('params-saved', function (event) {
        $scope.open('lg');
    });

    $scope.open = function (size) {
        $uibModal.open({
            animation: true,
            backdrop: false,
            templateUrl: 'jsonInputModal.html',
            controller: 'jsonInputModalController',
            size: size,
            resolve: {
                items: getKeyValues()
            }
        }).result.then(function (jsonString) {
            var jsonObj = JSON.parse(jsonString);
            ModalService.setParams(jsonObj.params);
            ModalService.setPem(jsonObj.pem);
            ModalService.setPwd(jsonObj.password);

            $rootScope.$broadcast('navbar-modal-set');
        }, function () { });
    };

    $scope.toggleAnimation = function () {
        $scope.animationsEnabled = !$scope.animationsEnabled;
    };

    function getKeyValues() {
        return {
            params: ModalService.getParams(),
            // pem:ModalService.getPem(),
            password: ModalService.getPwd()
        }
    }
}

export default mainController;
