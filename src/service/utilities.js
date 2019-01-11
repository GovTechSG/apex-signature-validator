import KJUR from 'jsrsasign';
export default {
    hexToBase64(hexstring) {
        return btoa(hexstring.match(/\w{2}/g).map(a => {
            return String.fromCharCode(parseInt(a, 16));
        }).join(''));
    },
    ascii_to_hexa(str) {
        let arr1 = [];
        for (let n = 0, l = str.length; n < l; n++) {
            let hex = Number(str.charCodeAt(n)).toString(16);
            arr1.push(hex);
        }
        return arr1.join('');
    },
    sortJSON(json) {
        let newJSON = {};
        let keys = Object.keys(json);
        keys.sort();
        for (let key of keys) {
            newJSON[key] = json[key];
        }
        return newJSON;
    },
    /**
    * 
    * @param {number} authLevel Auth level, 1 or 2
    * @param {string} baseString Signature base string
    * @param {string} key app secret if authLevel == 1, RSA key if authLevel == 2
    */
    signBaseString(authLevel, baseString, key) {
        let kjur, sig;
        if (authLevel === 2) {
            kjur = new KJUR.crypto.Signature({
                'alg': 'SHA256withRSA'
            });
            kjur.init(key);
            kjur.updateString(baseString);
            let sigVal = kjur.sign();
            sig = this.hexToBase64(sigVal);
        } else if (authLevel === 1) {
            kjur = new KJUR.crypto.Mac({
                alg: 'HmacSHA256',
                'pass': {
                    'hex': this.ascii_to_hexa(key)
                }
            });
            kjur.updateString(baseString);
            let hmacDigest = kjur.doFinal();
            sig = this.hexToBase64(hmacDigest);
        }
        return sig;
    },
    generateAuthToken(baseStringOptions, signedBaseString) {
        let realm = baseStringOptions.realm || baseStringOptions.appId;
        let authPrefix = baseStringOptions.authPrefix;
        return `${authPrefix.charAt(0).toUpperCase()}${authPrefix.slice(1)} realm="${realm}", ` +
            `${authPrefix}_app_id="${baseStringOptions.appId}", ` +
            `${authPrefix}_nonce="${baseStringOptions.nonce}", ` +
            `${authPrefix}_signature_method="${baseStringOptions.signatureMethod}", ` +
            `${authPrefix}_signature="${signedBaseString}", ` +
            `${authPrefix}_timestamp="${baseStringOptions.timestamp}", ` +
            `${authPrefix}_version="${baseStringOptions.appVersion}"`;
    }
};