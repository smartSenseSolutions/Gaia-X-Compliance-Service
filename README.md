<h1 align="center">Gaia-X Lab Compliance Service</h1>

[[_TOC_]]

## Gaia-X Trust Framework

For Gaia-X to ensure a higher and unprecedented level of trust in digital platforms, we need to make trust an easy to understand and adopted principle. For this reason, Gaia-X developed a [Trust Framework](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/) – formerly known as Gaia-X Compliance and Labelling Framework that safeguards data protection, transparency, security, portability, and flexibility for the ecosystem as well as sovereignty and European Control.

The Trust Framework is the set of rules that define the minimum baseline to be part of the Gaia-X Ecosystem. Those rules ensure a common governance and the basic levels of interoperability across individual ecosystems while letting the users in full control of their choices.

In other words, the Gaia-X Ecosystem is the virtual set of participants and service offerings following the requirements from the Gaia-X Trust Framework.

### Gaia-X Lab Compliance Service

The Compliance Service validates the shape, content and credentials of Self Descriptions and signs valid Self Descriptions. Required fields and consistency rules are defined in the [Trust Framework](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/).

There are multiple versions available, each corresponding to a branch in the code:
- https://compliance.lab.gaia-x.eu/development/docs/ is an instantiation of the [development branch](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/development). It is the latest unstable version. Please note that the deployment is done manually by the development team, and the service might not include the latest commits
- https://compliance.lab.gaia-x.eu/main/docs/ is an instantiation of the [main branch](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/main). It is the latest stable version. Please note that the deployment is done manually by the development team, and the service might not include the latest commits
  [2206 unreleased branch](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/2206-unreleased) is not instantiated. It is the implementation of the Trust Framework 22.06 document.
- [2204 branch](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/2204) is not instantiated. It is the implementation of the Trust Framework 22.04 document. 

## Get Started Using the API

- You can find the Swagger API documentation at `localhost:3000/docs/` or one of the links above

### How to create Self Descriptions

#### Step 1 - Create your VerifiableCredential

You can use the VerifiableCredential in the [test folder](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/main/src/tests/fixtures) as a starting point. See details in the [Architecture Document](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/participant/) and just remove the `proof`.


**Example Participant VerifiableCredential**

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/termsandconditions#", "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/participant#"],
  "type": ["VerifiableCredential", "gx:LegalParticipant"],
  "id": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
  "issuer": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
  "issuanceDate": "2023-03-21T12:00:00.148Z",
  "credentialSubject": {
    "id": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
    "gx:legalName": "Gaia-X European Association for Data and Cloud AISBL",
    "gx:legalRegistrationNumber": {
      "gx:taxID": "0762747721"
    },
    "gx:headquarterAddress": {
      "gx:countrySubdivisionCode": "BE-BRU"
    },
    "gx:legalAddress": {
      "gx:countrySubdivisionCode": "BE-BRU"
    }
  }
}
```

#### Step 2 - Sign your Participant VerifiableCredential

> **Note:**
> If you need help setting up your certificate, you can refer to the "[How to setup certificates](#how-to-setup-certificates)" section.

For this step you can use the signing tool to perform all steps automatically: https://gx-signing-tool.vercel.app/

Self Descriptions need to be signed by a resolvable key registered in a Trust Anchor endorsed by Gaia-X. The validity of keys is checked via the [Gaia-X Registry](https://gitlab.com/gaia-x/lab/compliance/gx-registry/).

To normalize your Self Description you can use any library that will provide `URDNA2015` normalization eg:`jsonld` .

The normalized Self Description should then be hashed with `sha256(normalizeSd)`. This hash can now be signed with your key resulting in a `jws`. Create a `proof` property with your signature and signing method.

**Example proof object (signature of the Self Description creator)**

```json
{
  "proof": {
    "type": "JsonWebSignature2020",
    "created": "2022-10-01T13:02:09.771Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.gaia-x.eu",
    "jws": "eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..XQqRvvuxW1xHUy_eRzOk4LwyjwlRofg0JBiO0nrWGHAjwMA87OVJ37mB6GylgEttEaUjXQV-QmbGfEnE-YQf5S7B-id9Lld-CC-vW8M-2EvXh3oQp3l5W35mvvdVQXBj16LLskQZpfZGRHM0hn7zGEw24fDc_tLaGoNR9LQ6UzmSrHMwFFVWz6XH3RoG-UY0aZDpnAxjpWxUWaa_Jzf65bfNlx2EdSv3kIKKYJLUlQTk0meuFDD23VrkGStQTGQ8GijY3BNo6QWw889tt5YKWtiSZjbDYYHsVCwMzPoKT0hVJ1wy2ve6pJ4MSYfhiMxoDq6YBOm-oYKYfBeN22fjqQ"
  } 
}
```

Add the `proof` object with your signature to your json.

**Example SD with added proof object**

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/termsandconditions#", "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/participant#"],
  "type": ["VerifiablePresentation"],
  "verifiableCredential": [{
    "@context": ["https://www.w3.org/2018/credentials/v1", "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/termsandconditions#", "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/participant#"],
    "type": ["VerifiableCredential", "gx:LegalParticipant"],
    "id": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
    "issuer": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
    "issuanceDate": "2023-03-21T12:00:00.148Z",
    "credentialSubject": {
      "id": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
      "gx:legalName": "Gaia-X European Association for Data and Cloud AISBL",
      "gx:legalRegistrationNumber": {
        "gx:taxID": "0762747721"
      },
      "gx:headquarterAddress": {
        "gx:countrySubdivisionCode": "BE-BRU"
      },
      "gx:legalAddress": {
        "gx:countrySubdivisionCode": "BE-BRU"
      }
    },
    "proof": {
      "type": "JsonWebSignature2020",
      "created": "2023-02-09T16:00:15.219Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..lylU5Iy9hWdUN9jX7mCC1WejBp5QneJYLJ4iswBWiy8z2Yg9-W274anOnhxFK7dtlNPxoQGMPbUpR383aw4pjP0k48Rql_GiaNoTEvqixPaiLBuBng1srO1St440nQ1u9S42cD519cJ_ITdOod9nNapGpbKbD9BuULB85mp9urnH231Ph4godd9QOSHtf3ybA2tb7hgENxBgL433f0hDQ08KJnxJM43ku7ryoew-D_GHSY96AFtyalexaLlmmmIGO-SnpPX0JJgqFlE7ouPnV6DCB9Y8c0DHOCZEdXSYnonVh5qjBM598RUXlmvEJ2REJeJwvU8A3YUUqEREKEmhBQ"
    }
  }]
}
```

#### Step 3 - Use the Gaia-X Signing tool to verify and sign your verifiableCredential

Head over to https://gx-signing-tool.vercel.app/ and put your participant in the input document (in the verifiableCredential array)
Put your signing private key in the private key field, and set the did where the public key can be found in a did.json file

**Request:**
**participant-sd.json**

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/termsandconditions#",
    "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/participant#"
  ],
  "type": [
    "VerifiablePresentation"
  ],
  "verifiableCredential": [
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/termsandconditions#",
        "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/participant#"
      ],
      "type": [
        "VerifiableCredential",
        "gx:LegalParticipant"
      ],
      "id": "did:web:abc-federation.gaia-x.community",
      "issuer": "did:web:abc-federation.gaia-x.community",
      "issuanceDate": "2023-03-21T12:00:00.148Z",
      "credentialSubject": {
        "id": "did:web:abc-federation.gaia-x.community",
        "gx-participant:legalName": "Gaia-X European Association for Data and Cloud AISBL",
        "gx-participant:registrationNumber": {
          "gx-participant:registrationNumberType": "local",
          "gx-participant:registrationNumber": "0762747721"
        },
        "gx:headquarterAddress": {
          "gx:countrySubdivisionCode": "BE-BRU"
        },
        "gx:legalAddress": {
          "gx:countrySubdivisionCode": "BE-BRU"
        },
        "gx-terms-and-conditions:gaiaxTermsAndConditions": "70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700"
      }
    }
  ]
}
```

**Response Object:**
The response object is a VerifiablePresentation containing the VerifiableCredential you sent, but with its signature in proof
```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/termsandconditions#",
    "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/participant#"
  ],
  "type": [
    "VerifiablePresentation"
  ],
  "verifiableCredential": [
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/termsandconditions#",
        "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/participant#"
      ],
      "type": [
        "VerifiableCredential",
        "gx:LegalParticipant"
      ],
      "id": "did:web:abc-federation.gaia-x.community",
      "issuer": "did:web:abc-federation.gaia-x.community",
      "issuanceDate": "2023-03-21T12:00:00.148Z",
      "credentialSubject": {
        "id": "did:web:abc-federation.gaia-x.community",
        "gx-participant:legalName": "Gaia-X European Association for Data and Cloud AISBL",
        "gx-participant:registrationNumber": {
          "gx-participant:registrationNumberType": "local",
          "gx-participant:registrationNumber": "0762747721"
        },
        "gx:headquarterAddress": {
          "gx:countrySubdivisionCode": "BE-BRU"
        },
        "gx:legalAddress": {
          "gx:countrySubdivisionCode": "BE-BRU"
        },
        "gx-terms-and-conditions:gaiaxTermsAndConditions": "70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700"
      },
      "proof": {
        "type": "JsonWebSignature2020",
        "created": "2023-04-06T14:05:43.169Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:web:abc-federation.gaia-x.community",
        "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..ME2O-0DM9dkHUeQprDLhagGmNVfgxnjHavCr5CbtqndYtVvEy_uuKgcTqOl8PCTN9BPTB136nVil9l8iNRe4_lQe77b7JSq8UUAONnoWuHtjJJuyhXpZbNCmShEvnoZN07PzKetm5pxBhU61ga0hHNnaNt5Id4CUCfgcR9ngAuoOS07P5zydXdM3eU6-FC9uLav5hlexPqYw5xtczQlNua6S5qeW5y_NVX2sl9F7llmO5J3mtz3Oc_a_NaU-IRDKTDzImy8se4imf_EMudQ2gCtl6kqbXpnU9DZgg1riCVkxW-HvrmS7HCMzd2C3fwYtX92jMSX1Rhbow12NweBJJw"
      }
    }
  ]
}
```


## How to set up certificates

The compliance service currently supports [X.509 certificates](https://www.ssl.com/faqs/what-is-an-x-509-certificate/) in Base64 encoding. You need a certificate authority(CA) which is either a Gaia-X endorsed trust-anchor or owns a certificate signed by one(chain of trust).

For a domain validated security level is a provider like [Let's Encrypt](https://letsencrypt.org/) sufficient. For further security it's possible to choose a CA with an included KYB(Know Your Business) process.

Regardless of which process you choose, you must have access to the private key of the certificate. Depending on the process of your CA, the private key is generated by you on your local machine or offered by the CA for download. Local generation is preferable for security reasons. Your CA service provider will assist you with this.

> **Important:**
> Once you have your private key, never share it with anyone.

Certificates usually come with `.pem` or `.crt` file extension encoded in Base64. When you open the file it should look like this:

**shortened example `.pem` file:**

```
-----BEGIN CERTIFICATE-----
MIIFKDCCBBCgAwIBAgISA8T5LSiytJbDX1OxeOnhA64gMA0GCSqGSIb...
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIFFjCCAv6gAwIBAgIRAJErCErPDBinU/+...
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw...
-----END CERTIFICATE-----

```

**At this point you should have your certificate ready with the associated private key.**

Now you have to generate the certificate chain out of you certificate if you don't have it already. You want to make sure that the root certificate is also included.

> You can use [whatsmychaincert.com](https://whatsmychaincert.com/) to generate your certificate chain using metadata from your certificate.

> If you use this certificate for your domain SSL/TLS configuration [whatsmychaincert.com](https://whatsmychaincert.com/) can be used to download your certificate chain using your domain. (This should be the case if you use [Let's Encrypt](https://letsencrypt.org/)) Alternatively visit your website and download your certificate(usually in `.pem`format) using browser tools.

**At this point you should have your certificate chain(including the root certificate) as `.pem` file.**

Now you have to make your certificate chain available under `your-domain.com/.well-known/x509CertificateChain.pem`.

After uploading your certificate chain you can head to the [Gaia-X Signing tool](https://gx-signing-tool.vercel.app). There you can sign your credential.

Delta DAO is providing [a tool](https://github.com/deltaDAO/self-description-signer) to generate your did.json that will need to be uploaded to `your-domain.com/.well-known/`

## Using self-issued certificates for local testing

This chapter enables you to validate and sign your self-signed self-descriptions with a locally running Compliance Service instance.

> **IMPORTANT**: Self-issued certificates which don't include a Gaia-X endorsed trust-anchor in their certificate-chain are **NOT** supported for the use with https://compliance.gaia-x.eu. This guide is for local testing ONLY. It can be used to check the conformity of self-descriptions.

> To simplify the local testing setup we will generate one certificate which will be used for both (signing your self-secription and signing in the name of your local compliance service). Usually these are seperated, but this allows you to skip locally hosting your `did.json` since we will use the one of the compliance service.

### Step 1: Generating a certificate

Generate a new key/certificate pair:

```bash
$ openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -sha256 -days 365
```

Convert the private key format to `pkcs8` (that's the needed format for the compliance service):

```bash
$ openssl pkcs8 -in key.pem -topk8 -nocrypt -out pk8key.pem
```

You should have generated 3 files at this point: 

1. `cert.pem` - certificate
2. `key.pem` - private key
3. `pk8key.pem` - private key in `pkcs8` format



### Step 2: Setting up the compliance service

Clone the repository:

```bash
$ git clone https://gitlab.com/gaia-x/lab/compliance/gx-compliance.git
$ cd gx-compliance
$ npm install
```



Setting up key+certificate for local `https ` (this is needed since the `did:web` can only be resolved using `https`):

```bash
$ cd ./src/secrets
$ openssl req -x509 -out dev-only-https-public-certificate.pem -keyout dev-only-https-private-key.pem \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

This generates 2 files which should exist in the `secrets` folder:

- `dev-only-https-private-key.pem`
- `dev-only-https-public-certificate.pem`



Setting up the environment variables:
Setup a `.env` file in the root directory of the project. Iclude the following variables:

`gx-compliance/.env`:

```
X509_CERTIFICATE=`-----BEGIN CERTIFICATE-----
copy `cert.pem` content
-----END CERTIFICATE-----`
privateKey=`-----BEGIN PRIVATE KEY-----
copy `pk8key.pem` content
-----END PRIVATE KEY-----`
REGISTRY_URL='https://registry.gaia-x.eu'
BASE_URL='https://localhost:3000'
NODE_TLS_REJECT_UNAUTHORIZED='0'
LOCAL_HTTPS='true'
DISABLE_SIGNATURE_CHECK='true'
```



WARNING: Use these 3 variables for **LOCAL TESTING ONLY**!

```
NODE_TLS_REJECT_UNAUTHORIZED='0'
LOCAL_HTTPS='true'
DISABLE_SIGNATURE_CHECK='true'
```

- `NODE_TLS_REJECT_UNAUTHORIZED` allows the app to call self-signed https-urls.

- `LOCAL_HTTPS` enables the use of https for local development (needed for did:web resolver)

- `DISABLE_SIGNATURE_CHECK` will disable the registry call to check the certificate chain for a valid trust-anchor (all certificates will always be seen as valid in this regard)

  

Copy the certificate from `cert.pem` into `gx-compliance/src/static/.well-known/x509CertificateChain.pem`. Replace the existing certificate chain with the generated `cert.pem`.



Run this after **every** change to `BASE_URL` or `x509CertificateChain.pem`. Static files like the `did.json` or `x509CertificateChain.pem` will be prepared (also the index page).

```bash
$ npm run build
```



Start the compliance service

```bash
$ npm run start

or 

$ npm run start:dev  // for hot reloading after code changes
```



### Step 3: Sign your self-description

If you've already signed your self-description, you can skip to the end of this step.

If you have a certificate issued by a certificate authority(CA) which is either a Gaia-X endorsed trust-anchor or owns a certificate signed by one(chain of trust), you can use this certificate. In this case check out the **"How to setup certificates"** section. Make sure to host your `did.json` in a reachable space and adjust your `did:web `(`VERIFICATION_METHOD`) for the `did.json`.



**Sign your SD using the generated** `pk8key.pem` and `cert.pem`

If you know what you are doing you can manually perform the signing process.
> There are tools provided by the community, such as the [Self-Description signer tool](https://github.com/deltaDAO/self-description-signer),
>  which uses the Compliance Service api and helps with signing and generating the proof. For more information, see their section *"Environment variables for self-issued certificates"*.

1. The given Self Description has to be canonized with [URDNA2015](https://json-ld.github.io/rdf-dataset-canonicalization/spec/). You can use the `/api/normalize` route of the compliance service.
2. Next the canonized output has to be hashed with [SHA256](https://json-ld.github.io/rdf-dataset-canonicalization/spec/#dfn-hash-algorithm).
3. That hash is then signed with the your `pk8key.pem` private key and you have to create a proof object using [JsonWebKey2020](https://w3c-ccg.github.io/lds-jws2020/#json-web-signature-2020). General info about proofs in verifiable credentials: https://www.w3.org/TR/vc-data-model/#proofs-signatures
 

For this local test setup the creation of the `did.json` can be skipped. Since we are using the `did.json` of the compliance service also for the self-description for simplicity reasons. Usually you would host it under your own domain together with the `x509CertificateChain.pem` in the `.well-known/` directory.


Now you should have your verifiable credential signed by yourself. If you've used the signer-tool, you already have the complete verifiable credential as well which is signed by the compliance service. 

If you only have the self-signed self-description you can head to `https://localhost:3000/docs/#/Common/CommonController_issueVC`

to let the compliance service sign your self-description.


## Get Started With Development

---
**NOTE**

For details on how the code is structured and how to create a Merge Request
please check the instructions from CONTRIBUTING.md

---

- This application is based on [nest.js](https://nestjs.com/) and TypeScript.
- The nest.js documentation can be found [here](https://docs.nestjs.com/).

Clone the repository and jump into the newly created directory:

### Setup the environment

Make sure docker and docker-compose are available on your setup. Clone the repository and jump into the newly created directory:

```bash
$ git clone https://gitlab.com/gaia-x/lab/compliance/gx-compliance.git
$ cd gx-compliance
```

Don't forget to set up your `.env` file in the project's root directory. An example file can also be found in the root directory (`example.env`). Copy this file and adjust the values.

```bash
$ cp example.env .env
```

- **X509_CERTIFICATE** - your compliance service certificate
- **privateKey** - your compliance service private key (needed to sign verified Self Descriptions)
- **REGISTRY_URL** - link to your hosted registry or any other trusted registry. E.g. `https://registry.gaia-x.eu`
- **BASE_URL** - the url of the location for the compliance service. This is used to generate the did:web of the complaince service instance. E.g. `http://localhost:3000`
- **APP_PATH** - the path the compliance service is available on. . E.g. `/demo`. Note that you have to modify the `BASE_URL` yourself to match with `APP_PATH`

---
**NOTE**

If you are using a locally deployed registry, make sure it is up and running before starting the compliance service.
Also, make sure the proper adjustments are done in the .env and docker-compose.yaml files (in the compliance repo):
- by default both registy and compliance use http://localhost:3000 as their endpoint, make sure they are different in the local setup
- by default the registry and compliance containers are set up on separate networks; make sure there is connectivity between them or they use the same network
- the value for REGISTRY_URL is properly set in the .env file

---

### Installation

```bash
$ npm install
```

### Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

If everything is setup correctly, you can start the development environment with docker-compose. Make sure that the Docker daemon is running on your host operating system.

```sh
docker-compose up
```

---
**NOTE**

You can access the compliance API in your local browser at http://127.0.0.1:3000/docs/
Make sure to adjust the port in the url if you changed the default value in the .env file

---


### Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

# Deployment

A helm chart is provided inside `/k8s/gx-compliance` folder.

It provides several environment variables for the application:

| Env Variable        | Name in values file            | Default value                                                    | Note                                                                                                            |
|---------------------|--------------------------------|------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| APP_PATH            | ingress.hosts[0].paths[0].path | /main                                                            | Deployment path of the application                                                                              |
| BASE_URL            |                                | https://<ingress.hosts[0].host>/<ingress.hosts[0].paths[0].path> | URL of the deployed application                                                                                 |
| REGISTRY_URL        | urls.registry                  | https://registry.lab.gaia-x.eu/development                       |                                                                                                                 |
| privateKey          | privateKey                     | base64 value of "empty"                                          | This value is assigned automatically and contains the privateKey content. Stored in a secret in the cluster     |
| X509_CERTIFICATE    | X509_CERTIFICATE               | base64 value of "empty"                                          | This value is assigned automatically and contains the x509 certificate chain. Stored in a secret in the cluster |
| SD_STORAGE_BASE_URL | urls.storage                   | https://example-storage.lab.gaia-x.eu                            ||
| SD_STORAGE_API_KEY  | storageApiKey                  | "Nothing"                                                        ||

Usage example:

```shell
helm upgrade --install -n "<branch-name>" --create-namespace gx-compliance ./k8s/gx-compliance --set "nameOverride=<branch-name>,ingress.hosts[0].host=compliance.lab.gaia-x.eu,ingress.hosts[0].paths[0].path=/<branch-name>,image.tag=<branch-name>,ingress.hosts[0].paths[0].pathType=Prefix,privateKey=$complianceKey,X509_CERTIFICATE=$complianceCert"
```

The deployment is triggered automatically on `development` and `main` branches. Please refer to [Gaia-X Lab Compliance Service](#gaia-x-lab-compliance-service) for available instances. 