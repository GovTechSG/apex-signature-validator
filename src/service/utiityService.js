/**
 * Created by tankunsheng on 3/7/17.
 */
function utilSvc () {
    return {
        hexToBase64: function (hexstring) {
            return btoa(hexstring.match(/\w{2}/g).map(function (a) {
                return String.fromCharCode(parseInt(a, 16))
            }).join(''))
        },
        ascii_to_hexa: function (str) {
            var arr1 = []
            for (var n = 0, l = str.length; n < l; n++) {
                var hex = Number(str.charCodeAt(n)).toString(16)
                arr1.push(hex)
            }
            return arr1.join('')
        },

        sortJSON: function (json) {
            var newJSON = {}
            var keys = Object.keys(json)
            keys.sort()
            for (var key in keys) {
                newJSON[keys[key]] = json[keys[key]]
            }
            return newJSON
        }
    }
}
export default utilSvc
