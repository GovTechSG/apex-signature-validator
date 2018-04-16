function modalService() {
    return {
        setParams(params) {
            this.params = params;
        },
        getParams() {
            return this.params;
        },
        setPem(pem) {
            // this.params[name] = value;
            this.pem = pem;
        },
        getPem() {
            return this.pem;
        },
        setPwd(pwd) {
            this.pwd = pwd;
        },
        getPwd() {
            return this.pwd;
        },
        setRealmUri(realmUri) {
            this.realmUri = realmUri;
        },
        getRealmUri() {
            return this.realmUri;
        }
    };
}

export default modalService;