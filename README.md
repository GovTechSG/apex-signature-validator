# APEX Signature Validator
The Apex Signature Validator is an AngularJS application that assists APEX API consumers in verifying whether signatures 
are generated correctly in their applications when restful API calls are made to the APEX API Gateway. 

## Running Apex Signature Validator
Download the latest release archive and run `index.html` directly in your browser.

**Note**

1. To be able to use the *Send Test Request* function, use the scripts found in the `browser-scripts` directory to open Apex Signature Validator in Google Chrome. See [Sending test requests with the signature validator](#sending-test-requests-with-the-signature-validator) for more details
2. Signature validtor has been tested on Chrome, Firefox and Internet Explorer 11.

## Apex signatures explained

There are three components
that are of importance when it comes to formulating the correct authorization header: basestring, signature, authorization header.

- Basestring
    - The string of text (plaintext) that will be ran against HmacSHA256 for level 1 with a shared key to generate a digest OR:
    - The string of text (plaintext) that will be ran against SHA256withRSA algorithm where the generated digest would be 
    encrypted via RSA with the consumers' private key (to be derived from a PEM formatted private key).
    - The composition of the basestring includes: {prefix}_app_id (Generated from the API Gateway), {prefix}_nonce, {prefix}_signature_method(HmacSHA256 or SHA256withRSA), 
    {prefix}_timestamp and any additional parameters (additional parameters do not require prefix). All parameters are then ordered by 
    their key names.
    An example of a basestring is as such

        ``
        GET&https://example.com/v1/helloworld/nocors&{prefix}_app_id=appid&{prefix}_nonce=59242635618&
        {prefix}_signature_method=SHA256withRSA&{prefix}_timestamp=1501147626306&{prefix}_version=1.0&
        firstparam=valueoffirstparam&secondparam=valueofsecondparam
        ``

- Signature
    - A base64 representation of the digest (HmacSHA256 level 1) or ciphertext (SHA256withRSA) derived from the basestring.

- Authorization Header 
    - The request authorization header begins with the prefix, the key 'realm' with the value being the api endpoint followed 
    by all the parameters keys and values separated by commas. The generated signature is included with its being {prefix}_signature. 
    An example of a generated authorization header is as follows

        ``
        Authorization: Apex realm="https://example.com/v1/helloworld/nocors",{prefix}_app_id=appid,
        {prefix}_nonce="98344891638",{prefix}_signature="p1WxtrYhM5L8RkAwQQ59PoZ2+5Yr05kHtC0Bh+nalnPg7SuL4/TTcmxhRmGYioSyYQHoMpKyryx0QbWaBKZDRVK4nIiznJ9L9X+IUAQ
        XMWwSdtjOnjMjgZF06EGfyClFbRIGjJDrbwJeuRutji3/qdj9vZMqXRY/hAwnIfTk7IWPUBd9OrQG0PHMDOREl1mAhABk04MOfTAXCMCwx6z70MoIrc0EhQuuygMertnFS4mU0+hxQtgrPjoDZ
        LPsRgFIkU9iPCKKVAMMc3jAkZq6X8BKImJJB4fXMCv6CfCDwd0PFeY4TG6CFhU7h49XAS+e+sO3HWeCzyXxtinhywIxIw==",{prefix}_signature_method="SHA256withRSA",{prefix}_timestamp=
        "1501225489066",{prefix}_version="1.0"
        ``

## Building Apex Signature Validator
From the root directory:

1. `npm install`
2. `npm run build`

The minified **production** build will be bundled by webpack into the `dist` folder under your project root directory.

## Developing Apex Signature Validator

From the root directory:

1. `npm install`
2. `npm run devserver`

This spins up a [Webpack Dev Server](https://github.com/webpack/webpack-dev-server) instance that supports live reloading when changes are detected in the code base.

3. Launch Web Browser

For macOS , run the following

```
./browser-scripts/launch.command
```

For Windows , move to the release directory and type the name of the batch file. Alternatively, double-click on it
```
launch.bat
```

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
When sending test requests to Apex's gateways, eg. to `api.gov.sg` endpoints, the signature validator's `Send Test Request` function would need to make cross-origin requests. For security reasons, browsers restrict cross-origin HTTP requests initiated using Javascript.

If you are getting a response code of -1 when sending a test request, your browser could be rejecting your cross-origin request.

In order for cross-origin requests to be ignored on browser clients, web browsers such as Chrome would have to be launched with web security disabled.

To simplify this process, two scripts are included in the `browser-scripts` directory:

1. `mac startup.command`
2. `windows startup.bat`

These scripts would automatically open the signature validator in a new Chrome window with web security disabled. The browser would then allow cross-origin requests to be sent from the browser.
