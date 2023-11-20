## [1.9.1](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.9.0...v1.9.1) (2023-11-20)


### Bug Fixes

* allow override ntpServers list ([ecbf4ae](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/ecbf4aeb3dff36b8e0f9e148a4d3cf5f7fa0772a)), closes [#61](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/issues/61)

# [1.9.0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.8.1...v1.9.0) (2023-10-23)


### Bug Fixes

* get credential atomic types ([91d77b5](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/91d77b533d7ab0a8fff01551fe0a54c3a8641f14)), closes [#54](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/issues/54)


### Features

* implement compliance on missing classes ([cdbafd0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/cdbafd02771e6a5e477394d6195afefeb450715c))

## [1.8.1](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.8.0...v1.8.1) (2023-10-02)


### Bug Fixes

* cosign is missing in build-tag job ([3d53153](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/3d5315368b33f2a70528a3b0963ecb7de2f3f906))

# [1.8.0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.7.1...v1.8.0) (2023-09-29)


### Bug Fixes

* gx compliance credentials invalid ID ([489c398](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/489c398bd58e936ac99a21d624c6c48f13cc7328)), closes [#56](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/issues/56)
* invalid verification method loaded ([746ea6d](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/746ea6dcb364ee2f031e2721db10a383fb59ee9f)), closes [#32](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/issues/32)


### Features

* sign containers using cosign ([dfd1194](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/dfd119469dfaad1fbc45f96f9872495b6546657e))

## [1.7.1](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.7.0...v1.7.1) (2023-09-12)


### Bug Fixes

* remove nodes from db ([00e48ec](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/00e48ec0c461b1c149471798ae8c082eb2e6697b))

# [1.7.0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.6.0...v1.7.0) (2023-09-05)


### Bug Fixes

* improper character for slashes in did ([d467d2d](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/d467d2d2185ff977d2487aa3ab43d3a5a25ffd1d))
* try to improve performances ([5f97a6c](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/5f97a6c410de221d0505f8a329ce20f53d03ed07))


### Features

* add original credential subject type in gx:compliance ([a25e37d](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/a25e37d5b7520e2d38e0fe28fb534eda9a31a4b5))
* use canonicalize for VC hash ([2e705c7](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/2e705c7529d035d252d19ce46cfd6f97c624b704))

# [1.6.0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.5.0...v1.6.0) (2023-08-28)


### Bug Fixes

* add integrity and tf version in normalization ([7b50726](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/7b5072696d026ed13b34419bd12b8dd841ed717e))
* add jws2020 context in issued VC ([f599d97](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/f599d97eec48d9845876fc5c5ae8c775192121e1)), closes [#48](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/issues/48)
* display an explicit error on unresolvable DIDs ([0008747](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/00087479179fbd0077316b172dc7f3b9af52f501))
* **LAB-348:** missing key fragment in verification method ([1a2e037](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/1a2e03748c8a21cf02a2111108ed6a4d24c9dc2b))
* **TAG-179:** prevent validation avoidance ([3b4a79d](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/3b4a79d86ad1b296a804d32710cc0457dae81cd7))


### Features

* add terms and conditions example ([f883555](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/f883555e77ef66e91e0d6610f05e2a2a973f297e))
* check LRN issuers is trusted ([b54c0f9](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/b54c0f9dbefc7c82f22d5a09c7de4ab3cf3acdd8))
* **jwt:** add Verifiable Presentation response in JWT format [TAG-176] ([0292874](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/02928741c7071de30c9c9295599e1caad760c47a))
* **TAG-130:** require issuers to provide ts&cs ([190b677](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/190b677a5a84dbf4badcd02474b196604ad1ce6f))
* **TAG-78:** fetch ntp time for verifiable credentials dates ([e1f8e7a](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/e1f8e7a952ba0ee9c0b7135797842ebaf8f8896a))
* update examples ([40625d0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/40625d0845d738c72bd68b6634cb93531daa0d93))

# [1.5.0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.4.0...v1.5.0) (2023-07-06)


### Features

* **jwt:** wrap JWT VC into a "vc" claim ([6469d25](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/6469d25ff68dd4e37b54b5ae3ba1e3df78503934))

# [1.4.0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.3.0...v1.4.0) (2023-06-22)


### Features

* accept and produce JWT ([ad37950](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/ad37950adf693175ff9ea45e3f2a80cfd2557b81))
* set jwt subject from VC id or provider ([5354ba8](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/5354ba8fd90233de74f617175b85342cdcbd83f6))

# [1.3.0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.2.8...v1.3.0) (2023-06-21)


### Features

* publish changelogs on slack ([e9a391e](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/e9a391e818a5082c76c7253884bfbe38e9fee6cb))

## [1.2.8](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.2.7...v1.2.8) (2023-05-24)


### Bug Fixes

* clean up & semantic-release gitlab ([83b4899](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/83b4899283d58162709f26b28754534bb4a214fd))

## [1.2.7](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.2.6...v1.2.7) (2023-05-22)


### Bug Fixes

* update examples after fix on registry ([55b6053](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/55b6053a78764a4d3cc42291e6c9e3318a8e4039))

## [1.2.6](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.2.5...v1.2.6) (2023-04-27)


### Bug Fixes

* use proper registry url in context of VC ([79c66f7](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/79c66f780680edb86b1c4e97b043d1b8ae15d541))

## [1.2.5](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.2.4...v1.2.5) (2023-04-24)


### Bug Fixes

* do not validate shapes that are not defined in registry ([9cc4018](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/9cc40180b25d31557463852a2b973aa0443d6ff9))

## [1.2.4](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.2.3...v1.2.4) (2023-04-19)


### Bug Fixes

* expose openapi as JSON file ([1e57b7f](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/1e57b7f5f66544c83c21dc87a72c4812c67a1302))
* expose openapi as JSON file ([4088bf4](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/4088bf4b2fb8ac584bbf42ae6e2405416c60cf9b))
* expose openapi as JSON file ([bfb0ab5](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/bfb0ab54de65b6970048d3a0ad97f85b48e3d014))

## [1.2.3](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.2.2...v1.2.3) (2023-04-18)


### Bug Fixes

* registry_url points to cluster registry ([6617155](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/6617155f537cd12f4e6d32f0421dcb06e4e6b21c))

## [1.2.2](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.2.1...v1.2.2) (2023-04-17)


### Bug Fixes

* image tags in build-release-tag-image job ([ee33c3f](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/ee33c3fbd7fc4be00702be48ece1e66b3d147e02))

## [1.2.1](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.2.0...v1.2.1) (2023-04-17)


### Bug Fixes

* skip useless builds & fix release ([e4f0522](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/e4f0522e1c2b1993ac9f530518a9a062a9ac4e28))

# [1.2.0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.1.0...v1.2.0) (2023-04-17)


### Bug Fixes

* push several tags on each release ([2d64174](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/2d641740fdcc22c3dd50eb014a0c034bbe8f8640))


### Features

* allow user to provide VC id in request ([19b4269](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/19b4269df9443a8795c10a866c42992620224652))

# [1.1.0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/compare/v1.0.0...v1.1.0) (2023-04-13)


### Bug Fixes

* atomic type when using array for a single value ([fc6adb1](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/fc6adb1e6c7279f541364974ee93527cdfd5fa72))
* fix compliance after participant service offering shape merge ([04ffa82](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/04ffa82ef9585915e4f97eac109f84026bc08761))


### Features

* enable service offering credential offer ([915d918](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/915d918a5b340589fb68e46fc78a730dea65a797))
* fixup code to accept registrationNumber from notary ([721acac](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/721acac1a59aca7166e5bb4c40b5f0368479768a))
* validate global shape of the vp instead of each vc ([0aded61](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/0aded617b1b0a2a95ef5dcb259579311ab0890d7))

# 1.0.0 (2023-03-28)


### Bug Fixes

* add expected type for SDs ([f8cc5d3](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/f8cc5d3f4e9fa818643ea9b2dd11ed061f532309))
* adjust getTermsAndConditions to 2206 ([7b591aa](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/7b591aa9943ab35f9fd81fe8827302d7c8b7ceba))
* adjust import paths ([941eae5](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/941eae5da8bf530f2e23634c14c968e075689c4d))
* **content-validation.service:** remove duplicate slash from openCorporateBaseUri ([39abe58](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/39abe58ae8d645f14f1280f542ae07958544e8ff))
* disable not working 3rd party apis ([8476b63](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/8476b631d06f4af4f02f208e4efc0be91b51ad70))
* do not conform when content is false ([2892dca](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/2892dca7e1824563a59f672d94c441e6f0361e82))
* enable verificationMethod for development ([a9824fd](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/a9824fd3a3cbe7303583a91f68086c56455952ef))
* env e2e fixture to mock environments ([ce687a1](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/ce687a14a1e2dc08c0d1cd674762a1acd2db47ea))
* fix and enable tests ([b6868e0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/b6868e050c89c402ae8df0794dc7b0d643413260))
* invalid self description via url ([234b6f9](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/234b6f9c23b9b9a312625ff176abf2c609d9711e))
* **participant.e2e-spec:** fix tests ([42c328c](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/42c328c0112b0c371215966d5e1b81c042755b81))
* **participant.e2e:** increase timeout for tests ([df8b985](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/df8b98583a107e3bc1c4e87a9f8a56efbdc321b9))
* point registry to prod ([48e8923](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/48e892309d28abef4d243f2b31d413379b152bee))
* serve static files from app_path and not only root ([26389c5](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/26389c5858e144929feb50ab54c0c4683e65d69e))
* shacl validation ([acf74f1](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/acf74f1fa979b52b0d50640eea26fa357099e8fb))
* skip test SD with invalid registrationNumber ([910d81c](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/910d81ccb07c4f2bda2d30a6faa8cc5c2410d07d))
* skip tests ([e2ec671](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/e2ec671416020a995505a07b49bc1870da7433e4))
* **swagger:** use relative service offering module path ([650eb56](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/650eb5611cfaf75de489e56be82031930fe50ffe))
* typo ([dd04a52](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/dd04a52c8557904c73ba3e9b323fe7095e90f61e))
* use correct context for signature check ([45fa169](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/45fa169eb47b80943a23a87cb9ecac804fa5e995))
* use env var for registry url ([9ee90d0](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/9ee90d02bea0a127e6727828a6d7adb32dc5eb2c))
* use id from did.json to find verificationMethod ([09ded3c](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/09ded3c630be092b1ccdb9615afffef89ab2da55))
* **validation:** update property path ([c94e54d](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/c94e54d72b8fdccb96df85e0c7f3158919e98a33))


### Features

* adapt joi VC schema to w3c ([b234bfc](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/b234bfc22df6369bbf6fc1a92bfd13bb0950dfc7))
* add .nvmrc ([a850ecb](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/a850ecb2485b9fdf9f0bc02ce1f25ca0134f4933))
* add 2206 test fixtures for sds ([67d033b](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/67d033b5f44ddeec9a579b92a374ed3d0acd18e7))
* add did:web resolver ([c92a066](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/c92a066dcdc6158caaa319a08d43d0cc7ff8825f))
* add draft of .well-known static files ([2034827](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/2034827d9b43e0af874faa027bd4425f53cb3fe7))
* add singapore iso3166-2 codes ([c680108](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/c68010878f403fddddfba4802e719ff9e48b585d))
* add verifyParticipant query param ([927c59c](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/927c59cf325788ab381d545093affceafc321cd9))
* add version ([94a47ae](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/94a47ae82bfa9013a376e5b7dc62b6993976a6da))
* add version api prefix ([086ff15](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/086ff15282bcca92226b5565190fd28761148b1a))
* change docs path ([08c1070](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/08c10707af63182d82975dbd6ff96cbf5062aae5))
* rework validation ([d580070](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/d58007085a9f43f804d8bce1759c10a56a4cbc0c))
* support validation schema ([32d638b](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/32d638bc52f3d074df0afcf193d36935ad0f1e30))
* **swagger:** enable api versioning ([d9fc30c](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/d9fc30c31096dc5b56a28191bb1dd3f7b4b339d8))
* update links to docs on index page ([16693f8](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/16693f8c1b6ef593d972407cfe07e4282db96194))
* validate sd shape via shacl ([6172826](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/commit/617282638f7825f02ab1061e605b93e9c35376af))
