![APEX Logo](https://github.com/GovTechSG/apex-signature-validator/blob/master/assets/color_apex_landscape.png)
***
# APEX Signature and JOSE Validator

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a20b2416cc2547e9ab6b3ef5669d82ec)](https://app.codacy.com/app/robincher/apex-signature-validator?utm_source=github.com&utm_medium=referral&utm_content=GovTechSG/apex-signature-validator&utm_campaign=badger)
[![GitHub license](https://img.shields.io/github/license/GovTechSG/apex-signature-validator.svg)](https://github.com/GovTechSG/apex-signature-validator/blob/master/LICENSE)
[![GitHub forks](https://img.shields.io/github/forks/GovTechSG/apex-signature-validator.svg)](https://github.com/GovTechSG/apex-signature-validator/network)


The Apex Signature Validator is an AngularJS application that assists APEX API consumers in verifying whether signatures are generated correctly in their applications when making restful API calls to the APEX API Gateway. 

You can find out more about Apex signature generation from our reference Node.js implementation at https://github.com/GovTechSG/node-apex-api-security.

## Table of contents
- [APEX Signature Validator](#apex-signature-validator)
  * [Running Apex Signature Validator](#running-apex-signature-validator)
  * [Apex signatures explained](#apex-signatures-explained)
    + [Basestring](#basestring)
    + [Signature](#signature)
    + [Authorization Header](#authorization-header)
  * [Saving and loading request parameters](#saving-and-loading-request-parameters)
  * [Building Apex Signature Validator](#building-apex-signature-validator)
  * [Developing Apex Signature Validator](#developing-apex-signature-validator)
      - [Using the development server through a browser](#using-the-development-server-through-a-browser)
      - [Executing test requests on the development server](#executing-test-requests-on-the-development-server)
  * [Application Structure](#application-structure)
    + [package.json](#packagejson)
    + [webpack.config.js](#webpackconfigjs)
    + [app.js](#appjs)
  * [Code Base](#code-base)
    + [controllers](#controllers)
    + [service](#service)
  * [JSRSASIGN](#jsrsasign)
  * [Sending test requests with the signature validator](#sending-test-requests-with-the-signature-validator)
- [JOSE (Javascript Object Signing and Encryption) Validator](#jose)

## Running Apex Signature Validator
Download and extract the latest [release](https://github.com/GovTechSG/apex-signature-validator/releases) and run `index.html` directly in your browser.

![homepage_1.png](https://github.com/GovTechSG/apex-signature-validator/blob/master/assets/homepage_1.png)

A basestring verification tool is provided for L1 and L2 authentication. This allows users to verify that basestrings in their own applications are correctly generated. This tool also highlights differences between its own and user-generated basestrings.

![basestring_correct.png](https://github.com/GovTechSG/apex-signature-validator/blob/master/assets/basestring_correct.png)

![basestring_different.png](https://github.com/GovTechSG/apex-signature-validator/blob/master/assets/basestring_different.png)

**Note**

1. To to use the **Send Test Request** function, use one of the provided OS-appropriate scripts to open Google Chrome with web security disabled. This means running Google Chrome with the `--disable-web-security` and `--ignore-certificate-errors` flags. See [Sending test requests with the signature validator](#sending-test-requests-with-the-signature-validator) for more details.

    - `launch-chrome-macos.command`
    - `launch-chrome-windows.bat or launch-chrome-windows.lnk`

2. Apex Signature Validator has been tested on Google Chrome, Firefox and Internet Explorer 11.

## Apex signatures explained

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

![params_loading.png](https://github.com/GovTechSG/apex-signature-validator/blob/master/assets/params_loading.png)

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

This spins up a [Webpack Dev Server](https://github.com/webpack/webpack-dev-server) instance that serves the bundled signature validator app (in memory). This server supports live reloading when changes are detected in the code base.

#### Using the development server through a browser

You can then access the development build on your browser at `http://localhost:8080` by default.

#### Executing test requests on the development server

To send test requests using the signature validator in development, you will need to access it using Google Chrome with web security disabled. See [Sending test requests with the signature validator](#sending-test-requests-with-the-signature-validator) for more details.

For Windows, open Google Chrome with web security disabled by opening the `browser-scripts/launch-chrome-windows.lnk` shortcut.

For macOS, open Google chrome with web security disabled by opening the `browser-scripts/launch-chrome-macos.command` file.

## Application Structure
```
- src
    - controllers
    - css
    - service
    - app.js 
    - package.json
    - webpack.config.js
- index.ejs
```

### package.json
Tracks library dependencies, notably Webpack that will be used to build the application. The build command in the script block 
instructs Webpack to look for the file webpack.config.js and displays the compilation progress. Refer to 
https://webpack.github.io/docs/cli.html for more information on Webpack cli commands.

### webpack.config.js
Specify the entry the point app.js and the output of the bundled files. Plugins and module loaders are used to uglify and 
bundle css as Webpack does not come with css bundling capabilities by default.

### app.js
The main angular module of the application and the entry point for Webpack. Controllers, factories and services are imported 
by Webpack with variable names and injected.

## Code Base
### controllers
Application code resides within the src folder, separated into the controllers and service sub directories. 
 - navbarController.js manages the navigation bar
 - paramsModalController.js manages the modal triggered by the options button on the navbar that allows user to save/load their parameters 
 through a json formatted file. 
 - mainController.js manages the application form where users input their parameters, calls functions in service to generate 
 basestrings and test their requests. 

The controllers are hooked onto the index.html page through ng-controller attributes. The modal template also resides
 within index.html.
### service
- config.js stores constant variables
- modalService.js is a singleton that stores parameters inputs to be fetched and share across both mainController and paramsModalController.
- testService.js functions that handle the process of generating basestring, signing basestring, creating auth header with the generated signature and sending the
test requests
- utilityService utility functions that convert between formats e.g hex to base64

## JSRSASIGN
The JSRSASIGN library is the opensource free pure JavaScript cryptographic library used by the application to perform all digest and RSA related 
operations. Refer to http://kjur.github.io/jsrsasign/ for more information including the api documentation.

## Sending test requests with the signature validator
When sending test requests to Apex's gateways, eg. to `api.gov.sg` endpoints, the signature validator's **Send Test Request** function would need to make cross-origin requests. For security reasons, browsers restrict cross-origin HTTP requests initiated using Javascript.

If you are getting a response code of -1 when sending a test request, your browser could be rejecting your cross-origin request.

In order for cross-origin requests to be ignored on browser clients, web browsers such as Chrome would have to be launched with web security disabled.

To simplify this process, Google Chrome launch scripts are included in the `browser-scripts` directory:


1. `launch-chrome-macos.command`
2. `launch-chrome-windows.lnk or launch-chrome-windows.bat`


These scripts would automatically open the signature validator in a new Chrome window with web security disabled. The browser would then allow cross-origin requests to be sent from the browser.

**Only use Google Chrome instances launched from these scripts to use the signature validator, do not access sites on the internet with them.**

## JOSE 

JOSE (Javascript Object Signing and Encryption) is an approach to signing and encrypting JSON content. If your API responses are packaged in any of the JOSE standards, you can use this client to further verify or decrpyt the corresponding API response.

### Verifying JWS
![jose_jws_verified.png](https://github.com/GovTechSG/apex-signature-validator/blob/master/assets/jose_jws_verified.png)

- Input : JWS API Response from the Gateway. As of now, we are only supporting it in JSON format.
- Public Certificate/Key : Public certificate that will be used to verify the JSON Web Signature. 
- Output : Data output upon successful verification.

### Decrypting JWE
![jose_jwe_verified.png](https://github.com/GovTechSG/apex-signature-validator/blob/master/assets/jose_jwe_verified.png)

- Input : JWE API Response from the Gateway in JSON format.
- Private Key : Private key that will be used to decrypt the JWE string.
- Output : Data output upon successful decryption.
