function modalService() {
    return {
        setParams: function (params) {
            this.params = params;
        },
        getParams: function () {
            return this.params;
        },
        setPem: function (pem) {
            // this.params[name] = value;
            this.pem = pem;
        },
        getPem: function () {
            return this.pem;
        },
        setPwd: function (pwd) {
            this.pwd = pwd;
        },
        getPwd: function () {
            return this.pwd;
        },
        setRealmUri: function (realmUri) {
            this.realmUri = realmUri;
        },
        getRealmUri: function () {
            return this.realmUri;
        }
    }
}
export default modalService;