import JOSE from 'jose';
import URL from 'urlsafe-base64';

function jwtService() {
    return {
        verifyJWS: function(input, publicKey) {
            try {
                let alg = JOSE.jwa(input.header.alg);
                let isValid = alg.verify(Buffer.from(input.protected + '.' + input.payload), URL.decode(input.signature), publicKey);
                return {
                    result: isValid,
                    output: JSON.parse(URL.decode(input.payload).toString('utf8'))
                };
            } catch (err) {
                return {
                    status: 'Error',
                    output: 'Failed to verify JWS ' + err
                };
            }
        },
        decryptJWE: function(input, privateKey) {
            try {
                let cipherText = URL.decode(input.ciphertext);
                let tag = Buffer.from(input.tag, 'base64');
                let aad = Buffer.from(input.protected, 'ascii');
                let iv = URL.decode(input.iv);
                let keytoUnwrap = URL.decode(input.encrypted_key);

                let RSA = new JOSE.jwa(input.header.alg);
                let unwrapped = RSA.unwrapKey(keytoUnwrap, privateKey);

                let AES = new JOSE.jwa(input.header.enc);
                let plain = AES.decrypt(cipherText, tag, aad, iv, unwrapped);

                return {
                    result: true,
                    output: JSON.parse(plain.toString())
                };
            } catch (err) {
                return {
                    status: 'Error',
                    output: 'Failed to decrypt JWE ' + err
                };
            }
        }
    };
}

export default jwtService;