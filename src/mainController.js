import apex_logo from './images/logo_apex.png';

mainController.$inject = ['stateService'];

function mainController(stateService) {
    let controller = this;

    controller.apex_logo = apex_logo; // path to logo file

    controller.isStateActive = function(stateName) {
        return stateName === stateService.state;
    }
}

export default mainController;
