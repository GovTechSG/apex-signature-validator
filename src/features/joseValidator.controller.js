import jwtService from '../service/jwtService';

function joseValidatorController(Notification) {
    let controller = this;

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
                response = jwtService.verifyJWS(JSON.parse(input), key);
            } else {
                response = jwtService.decryptJWE(JSON.parse(input), key);
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
            });
        }
    }
}

joseValidatorController.$inject = ['Notification'];

export default joseValidatorController;