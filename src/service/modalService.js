/**
 * Created by tankunsheng on 9/5/17.
 */
function foo() {

    // service is just a constructor function
    // that will be called with 'new'
    // var params = {};
    return {
        setParams: function (params) {
            this.params = params;
        },
        getParams: function() {
            return this.params;
        },
        setPem: function (pem) {
            // this.params[name] = value;
            this.pem = pem;
        },
        getPem: function () {
            return this.pem;
        },
        setPwd: function(pwd) {
            this.pwd = pwd;
        },
        getPwd: function(){
            return this.pwd;
        },
        setRealmUri: function(realmUri) {
            this.realmUri = realmUri;
        },
        getRealmUri: function() {
            return this.realmUri;
        }
    }
}
export default foo;