# Change Log
All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

## [0.3.7] - 2018-07-04
- Set-up snyk cli for patching
- Update vulnerable node dependency

## [0.3.6] - 2018-04-15
- Signature token generated no longer contains query params

## [0.3.5] - 2018-04-13
- Recognizes all PEM formatted private key headers for L2 signatures

## [0.3.4] - 2018-04-12
- Fixed query params handling in signature validator path

## [0.3.3] - 2018-04-06
### Updated
- Added support for the signature validator to load L2 private keys with -----BEGIN PRIVATE KEY----- headers

## [0.3.2] - 2018-03-31
### Updated
- Pre validation check for JOSE feature
- Improve general code quality

## [0.3.1] - 2018-03-29
### Updated
- UI to handle verification for JWS and JWE
- State separation between signature validator and JOSE validator
- .gitignore for local testing folder
### Added
- JOSE dependecy in package.json
- JOSE Verify and Decrypt feature

## [0.2.5] - 2018-03-24
### Updated
- Patch vulnerable dependency
### Added
- Change Log
- Contribution Template
- Pull Request and Issue Template

## [0.2.4] - 2018-02-22
### Updated
- Moved all assets inline into output html.

## [0.2.3] - 2018-02-21
### Updated
- Improve UI and Build Configuration

## [0.2.1] - 2018-02-21
### Updated
- Production build config in webpack

## [0.2.0] - 2018-02-20
### Added
- Initial release 