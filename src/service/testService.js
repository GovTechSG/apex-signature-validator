import KJUR from 'jsrsasign';

function foo($http, UtilityService) {
    return {
        generateBasestring: function (params, additionalParams) {
            let keys = Object.keys(params);
            for (let i = 0; i < keys.length; i++) {
                //add prefix only to attributes that are not prefix, uri, realm, request as these do not need the prefix
                if (keys[i] === 'prefix' || keys[i] === 'uri' || keys[i] === 'realm' || keys[i] === 'request')
                    continue;
                //construct the new key (prefix + keyname) into params object, then delete the old key
                params[params.prefix + '_' + keys[i]] = params[keys[i]];
                delete params[keys[i]];
            }
            //add additional parameters into params object
            for (let i = 0; i < additionalParams.length; i++) {
                if (!(additionalParams[i].name == null || additionalParams[i].name === '') &&
                    !(additionalParams[i].value == null || additionalParams[i].value === '')) {
                    params[additionalParams[i].name] = additionalParams[i].value
                }
            }
            //sort params base on key names
            let sortedParams = UtilityService.sortJSON(params);
            let sortedKeys = Object.keys(sortedParams);
            let baseString = params.request + '&' + params.uri;
            //form the base string
            for (let i = 0; i < sortedKeys.length; i++) {
                if (sortedKeys[i] === 'prefix' || sortedKeys[i] === 'uri' || sortedKeys[i] === 'realm' ||
                    sortedKeys[i] === 'request') {
                    continue
                }
                baseString += '&' + sortedKeys[i] + '=' + sortedParams[sortedKeys[i]]
            }
            return baseString
        },
        signBasestring: function (selectedLevel, basestring, key) {
            let kjur, sig;
            if (selectedLevel === 2) {
                kjur = new KJUR.crypto.Signature({
                    'alg': 'SHA256withRSA'
                });
                kjur.init(key);
                kjur.updateString(basestring);
                let sigVal = kjur.sign();
                sig = UtilityService.hexToBase64(sigVal)
            } else if (selectedLevel === 1) {

                kjur = new KJUR.crypto.Mac({
                    alg: 'HmacSHA256',
                    'pass': {
                        "hex": UtilityService.ascii_to_hexa(key)
                    }
                });
                kjur.updateString(basestring);
                let hmacDigest = kjur.doFinal();
                sig = UtilityService.hexToBase64(hmacDigest)
            }
            return sig;
        },
        genAuthHeader: function (params, signature) {

            let prefix = params.prefix + '_';
            params[prefix + 'signature'] = signature;

            let sortedParams = UtilityService.sortJSON(params);
            let keys = Object.keys(sortedParams);
            //remove realm and add to front
            keys.splice(keys.indexOf("realm"), 1);
            keys.unshift("realm");
            let authHeader = 'Authorization: ' + params['prefix'].charAt(0).toUpperCase() + params['prefix'].slice(1) + ' ';
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] === 'prefix' || keys[i] === 'uri' || keys[i] === 'request') {
                    continue
                }
                if (keys[i] !== 'realm') {
                    authHeader += keys[i] + '="' + sortedParams[keys[i]] + '",'
                }
                else {
                    authHeader += keys[i] + '="' + sortedParams["realm"] + '",'
                }
            }
            return authHeader;
        },


        sendTestRequest: function (url, method, auth, level) {
            if (level === 0) {
                return $http({
                    method: method,
                    url: url
                })
            } else {
                return $http({
                    method: method,
                    url: url,
                    headers: {
                        'Content-Type': 'text/plain',
                        'Accept': 'application/x-www-form-urlencoded',
                        'Authorization': auth
                    }
                })
            }

        }
    }
}

export default foo;
