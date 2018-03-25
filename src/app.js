import "babel-polyfill";
import angular from 'angular';
import uirouter from '@uirouter/angularjs';
import uinotification from 'angular-ui-notification';
import uibootstrap from 'angular-ui-bootstrap';
import ngsanitize from 'angular-sanitize';
import ngfx from 'ng-fx';
import angularanimate from 'angular-animate';

import 'bootstrap/dist/css/bootstrap.css';
import 'angular-ui-notification/dist/angular-ui-notification.css';

import mainController from './controllers/mainController.js';
import paramsModalController from './controllers/paramsModalController.js';
import navbarController from './controllers/navbarController.js';
import config from './service/config.js';
import testService from './service/testService.js';
import modalService from './service/modalService.js';
import utilService from './service/utiityService.js'

import './css/style.css';

const mainModule = angular.module("app", [uirouter, uibootstrap, uinotification, ngsanitize, ngfx, angularanimate])
    .config(["$urlRouterProvider", "$httpProvider", "$compileProvider",
        function ($urlRouterProvider, $httpProvider, $compileProvider) {
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
            $urlRouterProvider.otherwise("/");
        }])
    .constant('config', config)
    .controller('mainController', mainController)
    .controller('jsonInputModalController', paramsModalController)
    .controller('navbarController', navbarController)
    .factory('ModalService', modalService)
    .factory('TestService',  testService)
    .factory('UtilityService', utilService);

mainModule.directive('onReadFile', ['$parse',
    function ($parse) {
        return {
            restrict: 'A',
            scope: false,
            link: function (scope, ele, attrs) {

                let fn = $parse(attrs.onReadFile);
                ele.on('change', function (onChangeEvent) {
                    let reader = new FileReader();

                    reader.onload = function (onLoadEvent) {
                        scope.$apply(function () {
                            fn(scope, {$fileContents: onLoadEvent.target.result})
                        })
                    };
                    reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
                    ele.val('');
                })
            }
        }
    }
]);