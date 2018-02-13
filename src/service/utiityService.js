function utilSvc() {
    return {
        hexToBase64: function (hexstring) {
            return btoa(hexstring.match(/\w{2}/g).map(a => {
                return String.fromCharCode(parseInt(a, 16))
            }).join(''))
        },
        ascii_to_hexa: function (str) {
            let arr1 = [];
            for (let n = 0, l = str.length; n < l; n++) {
                let hex = Number(str.charCodeAt(n)).toString(16);
                arr1.push(hex)
            }
            return arr1.join('')
        },
        sortJSON: function (json) {
            let newJSON = {};
            let keys = Object.keys(json);
            keys.sort();
            for (let key in keys) {
                newJSON[keys[key]] = json[keys[key]]
            }
            return newJSON
        }
    }
}

export default utilSvc;
