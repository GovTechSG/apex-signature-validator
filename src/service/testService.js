/**
 * Created by kunsheng on 4/5/2017.
 */
import KJUR from 'jsrsasign';
function foo($http, UtilityService) {
    return {

        generateBasestring: function(params,additionalParams){
                var keys = Object.keys(params)
                for (var i = 0; i < keys.length; i++) {
                    //add prefix only to attributes that are not prefix, uri, realm, request as these do not need the prefix
                    if (keys[i] === 'prefix' || keys[i] === 'uri' || keys[i] === 'realm' || keys[i] === 'request')
                        continue
                    //construct the new key (prefix + keyname) into params object, then delete the old key
                    params[params.prefix + '_'+keys[i]] = params[keys[i]];
                    delete params[keys[i]];
                }
                //add additional parameters into params object
                for (var i = 0; i < additionalParams.length; i++) {
                    if ((additionalParams[i].name === undefined || additionalParams[i].name === '')
                        && (additionalParams[i].value === undefined || additionalParams[i].value === ''))
                        continue
                    params[additionalParams[i].name] = additionalParams[i].value
                }
                var prefix = params.prefix + '_'
                var newParams = {}
                //sort params base on key names
                var sortedParams = UtilityService.sortJSON(params)
                var keys = Object.keys(sortedParams)
                var baseString = params.request + '&' + params.uri
                //form the base string
                for (var i = 0; i < keys.length; i++) {
                    if (keys[i] === 'prefix' || keys[i] === 'uri' || keys[i] === 'realm' || keys[i] === 'request') {
                        continue
                    }
                    baseString += '&' + keys[i] + '=' + sortedParams[keys[i]]
                }
                return baseString
        },
        signBasestring : function(selectedLevel,basestring, key)
        {
            var kjur, sig;
            if (selectedLevel === 2) {
                kjur = new KJUR.crypto.Signature({
                    'alg': 'SHA256withRSA'
                })
                kjur.init(key)
                kjur.updateString(basestring)
                var sigVal = kjur.sign()
                sig = UtilityService.hexToBase64(sigVal)
            } else if (selectedLevel === 1) {

                kjur = new KJUR.crypto.Mac({
                    alg: 'HmacSHA256',
                    'pass': {
                        "hex":  UtilityService.ascii_to_hexa(key)
                    }
                })
                kjur.updateString(basestring)
                var hmacDigest = kjur.doFinal()
                sig = UtilityService.hexToBase64(hmacDigest)
            }
            return sig;
        },
        genAuthHeader : function(params, signature){

            var prefix = params.prefix + '_'
            params[prefix+'signature'] = signature

            var sortedParams = UtilityService.sortJSON(params)
            var keys = Object.keys(sortedParams)
            //remove realm and add to front
            keys.splice(keys.indexOf("realm"), 1)
            keys.unshift("realm")
            var authHeader = 'Authorization: ' + params['prefix'].charAt(0).toUpperCase() + params['prefix'].slice(1) + ' '
            for (var i = 0; i < keys.length; i++) {
                if (keys[i] === 'prefix' || keys[i] === 'uri' || keys[i] === 'request') {
                    continue
                }
                if (keys[i] !== 'realm') {
                    authHeader +=  keys[i] + '="' + sortedParams[keys[i]] + '",'
                }
                else {
                    // authHeader += keys[i] + '="' + sortedParams[keys[i]] + '",'
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
            }
            else
            {
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
};
export default foo;
