import apexLogo from './images/logo_apex.png';

mainController.$inject = ['stateService'];

function mainController(stateService) {
    let controller = this;

    controller.apexLogo = apexLogo; // path to logo file

    controller.isStateActive = function (stateName) {
        return stateName === stateService.state;
    }
}

export default mainController;