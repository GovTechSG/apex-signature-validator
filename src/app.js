import "babel-polyfill";
import angular from 'angular';
import uiRouter from '@uirouter/angularjs';
import uinotification from 'angular-ui-notification';
import uibootstrap from 'angular-ui-bootstrap';
import ngfx from 'ng-fx';
import angularanimate from 'angular-animate';

import 'bootstrap/dist/css/bootstrap.css';
import 'angular-ui-notification/dist/angular-ui-notification.css';

import mainController from './mainController';
import signatureValidator from './features/signatureValidator';
import joseValidator from './features/joseValidator';
import config from './service/config';
import jwtService from './service/jwtService';
import testService from './service/testService';
import modalService from './service/modalService';
import utilService from './service/utiityService';

import './css/style.css';

angular.module("app", [uibootstrap, uinotification, ngfx, angularanimate, uiRouter])
    .constant('config', config)
    .controller('mainController', mainController)
    .factory('ModalService', modalService)
    .factory('TestService', testService)
    .factory('JWTService', jwtService)
    .factory('UtilityService', utilService)
    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state({
                name: 'signatureValidator',
                url: '/signature-validator',
                controller: signatureValidator.controller,
                controllerAs: '$ctrl',
                template: signatureValidator.template
            })
            .state({
                name: 'joseValidator',
                url: '/jose-validator',
                controller: joseValidator.controller,
                controllerAs: '$ctrl',
                template: joseValidator.template
            });
        $urlRouterProvider.otherwise('/signature-validator');
    }])
    .directive('onReadFile', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            scope: false,
            link: function (scope, ele, attrs) {

                let fn = $parse(attrs.onReadFile);
                ele.on('change', function (onChangeEvent) {
                    let reader = new FileReader();

                    reader.onload = function (onLoadEvent) {
                        scope.$apply(function () {
                            fn(scope, {
                                $fileContents: onLoadEvent.target.result
                            });
                        })
                    };
                    reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
                    ele.val('');
                })
            }
        }
    }])
    .factory('stateService', function () {
        return {
            state: 'signatureValidator'
        }
    });