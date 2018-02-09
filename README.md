# APEX Sherlock Frontend Signature Validator
Sherlock Frontend Signature Validator is an application that assists APEX API consumers in verifying whether signatures 
are generated correctly in their applications when restful API calls are made to the APEX API Gateway. There are three components
that are of importance when it comes to formulating the correct authorization header: basestring, signature, authorization header.

- Basestring
    - The string of text (plaintext) that will be ran against HmacSHA256 for level 1 with a shared key to generate a digest OR:
    - The string of text (plaintext) that will be ran against SHA256withRSA algorithm where the generated digest would be 
    encrypted via RSA with the consumers' private key (to be derived from a PEM file).
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

## Application Structure
```
- frontend
    - public
        - html
        - javascript
        - stylesheets
    - src
        - controllers
        - css
        - service
        - app.js 
        - package.json
        - webpack.config.js
```

### package.json
Tracks library dependencies, notably Webpack that will be used to build the application. The build command in the script block 
instructs Webpack to look for the file webpack.config.js and displays the compilation progress. Refer to 
https://webpack.github.io/docs/cli.html for more information on Webpack cli commands.

### webpack.config.js
Specify the entry the point app.js and the output of the bundled files. Plugins and module loaders are used to uglify and 
bundle css as Webpack does not come with css bundling capabilities by default.

### public directory
Bundled js and css file will be outputted by Webpack into javascript and stylesheets folder respectively. The html folder 
holds index.html that is the stand alone web page application that holds Webpack uglified javascripts and css in tags. 

### app.js
The main angular module of the application and the entry point for Webpack. Controllers, factories and services are imported 
by Webpack with variable names and injected.

### npm run build
Run 'npm run build' in src folder to trigger the npm build script that will output the bundled js and css file into public
directory. The resulting scripts would then need to be be transferred into the script and style tags of the index.html file 
in order for the application operable standing alone.

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
- constants.js stores constant variables
- modalService.js is a singleton that stores parameters inputs to be fetched and share across both mainController and paramsModalController.
- testService.js functions that handle the process of generating basestring, signing basestring, creating auth header with the generated signature and sending the
test requests
- utilityService utility functions that convert between formats e.g hex to base64

## JSRSASIGN
The JSRSASIGN library is the opensource free pure JavaScript cryptographic library used by the application to perform all digest and RSA related 
operations. Refer to http://kjur.github.io/jsrsasign/ for more information including the api documentation.

## CORS Issue
In order for cross origin requests to be ignored on browser clients, web browsers such as chrome would have to be launched in a non-conventional manner.
To simplify this process, two scripts are included in the public -> html directory namely 'mac startup.command' and 'windows startup.bat' to automatically
open the application in a new chrome window that has disabled web security. This allows browsers to accept pre flight requests' responses that are not from
the same origin so that the actual request can be sent out following that.
