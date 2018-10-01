import apexLogo from './images/logo_apex.png';

function mainController() {
    let controller = this;

    controller.apexLogo = apexLogo; // path to logo file
    controller.version = VERSION;
}

mainController.$inject = [];

export default mainController;