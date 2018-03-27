import _ from 'lodash';

stateService.$inject = [];

function stateService() {
    let states = [
        {
            name: 'signatureValidator'
        },
        {
            name: 'joseValidator'
        }
    ];
    let currentState = states[0]; // Initial state is signature validator
    return {
        currentState: currentState,
        toState: function(stateName) {
            this.currentState = _.find(states, {name: stateName});
        }
    }
}

export default stateService;