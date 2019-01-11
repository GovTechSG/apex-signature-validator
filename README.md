![APEX Logo](/assets/color_apex_landscape.png)

# APEX Signature and JOSE Validator

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a20b2416cc2547e9ab6b3ef5669d82ec)](https://app.codacy.com/app/robincher/apex-signature-validator?utm_source=github.com&utm_medium=referral&utm_content=GovTechSG/apex-signature-validator&utm_campaign=badger)

The Apex Signature Validator is an AngularJS application that assists APEX API consumers in verifying whether signatures are generated correctly in their applications when making restful API calls to the APEX API Gateway. See it in action [here](https://govtechsg.github.io/apex-signature-validator/).

You can find out more about Apex signature generation from our reference Node.js implementation at https://github.com/GovTechSG/node-apex-api-security.

## Important

- If you are having trouble with [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) when testing your API endpoints, use the [server backed signature validator](https://github.com/govTechSG/apex-signature-validator-server) at https://apex-signature-validator.app.gov.sg. See [the section below for more details](#sending-test-requests-with-the-signature-validator)

- Apex Signature Validator has been tested on Google Chrome, Firefox and Internet Explorer 11.

## Apex signatures explained

[Full documentation for APEX App security](http://docs.akana.com/docs-test/cm/learnmore/app_security.htm)

There are three components that are of importance when it comes to formulating the correct authorization header: basestring, signature, authorization header.

### Basestring
Either:

- The string of text (plaintext) that will be used for HMAC-SHA256 generation used in level 1 authentication. A shared key is used to generate this digest.

Or:

- The string of text (plaintext) that will be used to create a SHA256 with RSA signature using the consumer's PEM-formatted private key.

The composition of the basestring includes: 

1. {prefix}_app_id (Generated from the API Gateway)
2. {prefix}_nonce
3. {prefix}_signature_method(HmacSHA256 or SHA256withRSA)
4. {prefix}_timestamp
5. Any additional parameters (additional parameters do not require a prefix).

All parameters are ordered by their key names.
An example of a basestring is as such:

`
GET&https://example.com/v1/helloworld/nocors&{prefix}_app_id=appid&{prefix}_nonce=59242635618&
{prefix}_signature_method=SHA256withRSA&{prefix}_timestamp=1501147626306&{prefix}_version=1.0&
firstparam=valueoffirstparam&secondparam=valueofsecondparam
`

### Signature
A base64 representation of the digest (HMAC-SHA256 for level 1) or ciphertext (SHA256 with RSA for level 2) derived from the basestring.

### Authorization Header 
The request authorization header begins with the prefix, the key 'realm' with the value being the api endpoint followed by all the parameters in key-value pairs separated by commas. The generated signature is included as {prefix}_signature. 
An example of a generated authorization header is as follows:

`
Authorization: Apex realm="https://example.com/v1/helloworld/nocors",{prefix}_app_id=appid,{prefix}_nonce="98344891638",{prefix}_signature="p1WxtrYhM5L8RkAwQQ59PoZ2+5Yr05kHtC0Bh+nalnPg7SuL4/TTcmxhRmGYioSyYQHoMpKyryx0QbWaBKZDRVK4nIiznJ9L9X+IUAQXMWwSdtjOnjMjgZF06EGfyClFbRIGjJDrbwJeuRutji3/qdj9vZMqXRY/hAwnIfTk7IWPUBd9OrQG0PHMDOREl1mAhABk04MOfTAXCMCwx6z70MoIrc0EhQuuygMertnFS4mU0+hxQtgrPjoDZLPsRgFIkU9iPCKKVAMMc3jAkZq6X8BKImJJB4fXMCv6CfCDwd0PFeY4TG6CFhU7h49XAS+e+sO3HWeCzyXxtinhywIxIw==",{prefix}_signature_method="SHA256withRSA",{prefix}_timestamp="1501225489066",{prefix}_version="1.0"
`

## Saving and loading request parameters

If you have request parameters that are reused often, you can load and save input request parameters in JSON files using the options menu located on the top right.

## Building Apex Signature Validator
From the root directory:

```
$ npm install
$ npm run build
```

The minified **production** build will be compiled by webpack into the `dist` folder under your project root directory.

## Developing Apex Signature Validator

From the project root directory:

```
$ npm install
$ npm run devserver
```

This spins up a [Webpack Dev Server](https://github.com/webpack/webpack-dev-server) instance that serves the bundled signature validator app (in memory). This server supports live reloading when changes are detected in the code base. You can then access the development build on your browser at `http://localhost:8080` by default.

## Sending test requests with the signature validator
When sending test requests to Apex's gateways, eg. to `api.gov.sg` endpoints, the signature validator's **Send Test Request** function would need to make cross-origin requests. For security reasons, browsers restrict cross-origin HTTP requests initiated using Javascript.

If you are getting a response code of -1 when sending a test request, your browser could be rejecting your cross-origin request.

## JOSE 

JOSE (Javascript Object Signing and Encryption) is an approach to signing and encrypting JSON content. If your API responses are packaged in any of the JOSE standards, you can use this client to further verify or decrpyt the corresponding API response.

### Verifying JWS
![jose_jws_verified.png](/assets/jose_jws_verified.png)

- Input : JWS API Response from the Gateway. As of now, we are only supporting it in JSON format.
- Public Certificate/Key : Public certificate that will be used to verify the JSON Web Signature. 
- Output : Data output upon successful verification.

### Decrypting JWE
![jose_jwe_verified.png](/assets/jose_jwe_verified.png)

- Input : JWE API Response from the Gateway in JSON format.
- Private Key : Private key that will be used to decrypt the JWE string.
- Output : Data output upon successful decryption.
