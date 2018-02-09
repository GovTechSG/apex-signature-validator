/**
 * Created by kunsheng on 28/4/2017.
 */
function foo($scope, $rootScope, ModalService, $uibModal){

    $scope.signClick = function()
    {
        console.log("signClick() called");
        $rootScope.$broadcast('navbar-sign-clicked');
    }
    $scope.modalClick = function()
    {
        $rootScope.$broadcast('navbar-modal-clicked');
    }

    $scope.$on('params-saved', function(event) {

        $scope.open('lg');
    });

    $scope.open = function (size) {

        var modalInstance = $uibModal.open({
            animation: true,
            backdrop:false,
            templateUrl: 'myModalContent.html',
            controller: 'jsonInputModalController',
            size: size,
            resolve: {
                items: getKeyValues()
            }
        });

        modalInstance.result.then(function (jsonString) {
            var jsonObj = JSON.parse(jsonString);
            ModalService.setParams(jsonObj.params)
            // ModalService.setBS(jsonObj.basestring)
            ModalService.setPem(jsonObj.pem)
            // ModalService.setSig(jsonObj.signature)
            // ModalService.setAuth(jsonObj.auth)
            ModalService.setPwd(jsonObj.password)

            $rootScope.$broadcast('navbar-modal-set');
            console.log(jsonObj);
        }, function () {
        });
    };

    $scope.toggleAnimation = function () {
        $scope.animationsEnabled = !$scope.animationsEnabled;
    };
    function getKeyValues()
    {
        return {
            params:ModalService.getParams(),
            // pem:ModalService.getPem(),
            password: ModalService.getPwd()
        }
    }
};
export default foo;


