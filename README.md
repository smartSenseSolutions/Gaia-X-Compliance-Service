<h1 align="center">Gaia-X Lab Compliance Service</h1>

- [Gaia-X Trust Framework](#gaia-x-trust-framework)
  - [Gaia-X Lab Compliance Service](#gaia-x-lab-compliance-service)
- [Get Started Using the API](#get-started-using-the-api)
  - [How to create Self Descriptions](#how-to-create-self-descriptions)
    - [Step 1 - Create your Participant Self Description](#step-1---create-your-participant-self-description)
    - [Step 2 - Sign your Participant Self Description](#step-2---sign-your-participant-self-description)
    - [Step 3 - Use the Compliance Service to verify and sign your Self Description](#step-3---use-the-compliance-service-to-verify-and-sign-your-self-description)
    - [Step 4 - Finalize your signed Self Description](#step-4---finalize-your-signed-self-description)
  - [Verify Self Descriptions](#verify-self-descriptions)
- [How to setup certificates](#how-to-setup-certificates)
- [Using self-issued certificates for local testing](#using-self-issued-certificates-for-local-testing)
  - [Step 1: Generating a certificate](#step-1-generating-a-certificate)
  - [Step 2: Setting up the compliance service](#step-2-setting-up-the-compliance-service)
  - [Step 3: Sign your self-description](#step-3-sign-your-self-description)
  - [Step 4: Verify your signed self-description](#step-4-verify-your-signed-self-description)
- [Get Started With Development](#get-started-with-development)
  - [Branch structure explained](#branch-structure-explained)
  - [Setup environment variables](#setup-environment-variables)
  - [Installation](#installation)
  - [Running the app](#running-the-app)
  - [Test](#test)

## Gaia-X Trust Framework

For Gaia-X to ensure a higher and unprecedented level of trust in digital platforms, we need to make trust an easy to understand and adopted principle. For this reason, Gaia-X developed a [Trust Framework](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/) – formerly known as Gaia-X Compliance and Labelling Framework that safeguards data protection, transparency, security, portability, and flexibility for the ecosystem as well as sovereignty and European Control.

The Trust Framework is the set of rules that define the minimum baseline to be part of the Gaia-X Ecosystem. Those rules ensure a common governance and the basic levels of interoperability across individual ecosystems while letting the users in full control of their choices.

In other words, the Gaia-X Ecosystem is the virtual set of participants and service offerings following the requirements from the Gaia-X Trust Framework.

### Gaia-X Lab Compliance Service

The Compliance Service validates the shape, content and credentials of Self Descriptions and signs valid Self Descriptions. Required fields and consistency rules are defined in the [Trust Framework](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/).

## Get Started Using the API

- You can find the Swagger API documentation at `localhost:3000/v2206/docs/` or https://compliance.gaia-x.eu/docs/
- The API routes are versioned to prevent breaking changes. The version is always included in the urls: `/v{versionNumber}/api` (example: `/v2206/api/participant/verify`)

### How to create Self Descriptions

#### Step 1 - Create your Participant Self Description

You can use the Self Descriptions in the [test folder](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/main/src/tests/fixtures) as a starting point. See details in the [Architecture Document](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/participant/).

> hint: You can use the same guide to create a Service Offering Self Description

**Example Participant Self Description**

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://registry.gaia-x.eu/v2206/api/shape"],
  "type": ["VerifiableCredential", "LegalPerson"],
  "id": "https://compliance.gaia-x.eu/.well-known/participant.json",
  "issuer": "did:web:compliance.gaia-x.eu",
  "issuanceDate": "2022-09-23T23:23:23.235Z",
  "credentialSubject": {
    "id": "did:web:compliance.gaia-x.eu",
    "gx-participant:name": "Gaia-X AISBL",
    "gx-participant:legalName": "Gaia-X European Association for Data and Cloud AISBL",
    "gx-participant:registrationNumber": {
      "gx-participant:registrationNumberType": "local",
      "gx-participant:registrationNumberNumber": "0762747721"
    },
    "gx-participant:headquarterAddress": {
      "gx-participant:addressCountryCode": "BE",
      "gx-participant:addressCode": "BE-BRU",
      "gx-participant:streetAddress": "Avenue des Arts 6-9",
      "gx-participant:postalCode": "1210"
    },
    "gx-participant:legalAddress": {
      "gx-participant:addressCountryCode": "BE",
      "gx-participant:addressCode": "BE-BRU",
      "gx-participant:streetAddress": "Avenue des Arts 6-9",
      "gx-participant:postalCode": "1210"
    },
    "gx-participant:termsAndConditions": "70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700"
  }
}
```

#### Step 2 - Sign your Participant Self Description

> **Note:**
> If you need help setting up your certificate, you can refer to the "[How to setup certificates](#how-to-setup-certificates)" section.

For this step you can use the signing tool to perform all steps automatically: https://github.com/deltaDAO/self-description-signer

Self Descriptions need to be signed by a resolvable key registered in a Trust Anchor endorsed by Gaia-X. The validity of keys is checked via the [Gaia-X Registry](https://gitlab.com/gaia-x/lab/compliance/gx-registry/).

To normalize your Self Description you must use the `/normalize` route of the API. [URDNA2015](https://json-ld.github.io/rdf-dataset-canonicalization/spec/) is at the base of the normalization. This will ensure consistency of the hashing process.

```bash
curl -X POST 'https://compliance.gaia-x.eu/v2206/api/normalize' -H "Content-Type: application/json" --data-raw  -d "@self-description.json"
```

The normalized Self Description should then be hashed with `sha256(normalizeSd)`. This hash can now be signed with your key resulting in a `jws`. Create a `proof` property with your signature and signing method.

**Example proof object (signature of the Self Description creator)**

```json
"proof": {
    "type": "JsonWebSignature2020",
    "created": "2022-10-01T13:02:09.771Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.gaia-x.eu",
    "jws": "eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..XQqRvvuxW1xHUy_eRzOk4LwyjwlRofg0JBiO0nrWGHAjwMA87OVJ37mB6GylgEttEaUjXQV-QmbGfEnE-YQf5S7B-id9Lld-CC-vW8M-2EvXh3oQp3l5W35mvvdVQXBj16LLskQZpfZGRHM0hn7zGEw24fDc_tLaGoNR9LQ6UzmSrHMwFFVWz6XH3RoG-UY0aZDpnAxjpWxUWaa_Jzf65bfNlx2EdSv3kIKKYJLUlQTk0meuFDD23VrkGStQTGQ8GijY3BNo6QWw889tt5YKWtiSZjbDYYHsVCwMzPoKT0hVJ1wy2ve6pJ4MSYfhiMxoDq6YBOm-oYKYfBeN22fjqQ"
}
```

Add the `proof` object with your signature to your json.

**Example SD with added proof object**

```json
{
  "@context": [
    "http://www.w3.org/ns/shacl#",
    "http://www.w3.org/2001/XMLSchema#",
    "https://registry.gaia-x.eu/api/v2206/shape/files?file=participant&type=ttl#"
  ],
  "type": ["VerifiableCredential", "LegalPerson"],
  "id": "https://compliance.lab.gaia-x.eu/.well-known/participant.json",
  "credentialSubject": {
    "id": "did:web:lab.compliance.gaia-x.eu",
    "gx-participant:name": "Gaia-X AISBL",
    "gx-participant:legalName": "Gaia-X European Association for Data and Cloud AISBL",
    "gx-participant:registrationNumber": {
      "gx-participant:registrationNumberType": "local",
      "gx-participant:registrationNumberNumber": "0762747721"
    },
    "gx-participant:headquarterAddress": {
      "gx-participant:addressCountryCode": "BE",
      "gx-participant:addressCode": "BE-BRU",
      "gx-participant:streetAddress": "Avenue des Arts 6-9",
      "gx-participant:postalCode": "1210"
    },
    "gx-participant:legalAddress": {
      "gx-participant:addressCountryCode": "BE",
      "gx-participant:addressCode": "BE-BRU",
      "gx-participant:streetAddress": "Avenue des Arts 6-9",
      "gx-participant:postalCode": "1210"
    },
    "gx-participant:termsAndConditions": "70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700"
  },
  "proof": {
    "type": "JsonWebKey2020",
    "created": "2022-10-01T13:02:09.771Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.gaia-x.eu",
    "jws": "eyJhbGciOiJSUzI1N...KYfBeN22fjqQ"
  }
}
```

#### Step 3 - Use the Compliance Service to verify and sign your Self Description

Head over to https://compliance.gaia-x.eu/v2206/docs/ and use the `/sign` route to sign your Self Description. The Compliance Service will sign the Self Description if it complies with the rules from the Trust Framework and if your provided proof is valid and return a Self Description including a new `complianceCredential` object.

**Request:**

```bash
curl -X POST 'https://compliance.gaia-x.eu/v2206/api/sign' -H "Content-Type: application/json" --data-raw  -d "@participant-sd.json"
```

**participant-sd.json**

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://registry.gaia-x.eu/v2206/api/shape"],
  "type": ["VerifiableCredential", "LegalPerson"],
  "id": "https://compliance.gaia-x.eu/.well-known/participant.json",
  "issuer": "did:web:compliance.gaia-x.eu",
  "issuanceDate": "2022-09-23T23:23:23.235Z",
  "credentialSubject": {
    "id": "did:web:compliance.gaia-x.eu",
    "gx-participant:name": "Gaia-X AISBL",
    "gx-participant:legalName": "Gaia-X European Association for Data and Cloud AISBL",
    "gx-participant:registrationNumber": {
      "gx-participant:registrationNumberType": "local",
      "gx-participant:registrationNumberNumber": "0762747721"
    },
    "gx-participant:headquarterAddress": {
      "gx-participant:addressCountryCode": "BE",
      "gx-participant:addressCode": "BE-BRU",
      "gx-participant:streetAddress": "Avenue des Arts 6-9",
      "gx-participant:postalCode": "1210"
    },
    "gx-participant:legalAddress": {
      "gx-participant:addressCountryCode": "BE",
      "gx-participant:addressCode": "BE-BRU",
      "gx-participant:streetAddress": "Avenue des Arts 6-9",
      "gx-participant:postalCode": "1210"
    },
    "gx-participant:termsAndConditions": "70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700"
  },
  "proof": {
    "type": "JsonWebSignature2020",
    "created": "2022-10-01T13:02:09.771Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.gaia-x.eu",
    "jws": "eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..XQqRvvuxW1xHUy_eRzOk4LwyjwlRofg0JBiO0nrWGHAjwMA87OVJ37mB6GylgEttEaUjXQV-QmbGfEnE-YQf5S7B-id9Lld-CC-vW8M-2EvXh3oQp3l5W35mvvdVQXBj16LLskQZpfZGRHM0hn7zGEw24fDc_tLaGoNR9LQ6UzmSrHMwFFVWz6XH3RoG-UY0aZDpnAxjpWxUWaa_Jzf65bfNlx2EdSv3kIKKYJLUlQTk0meuFDD23VrkGStQTGQ8GijY3BNo6QWw889tt5YKWtiSZjbDYYHsVCwMzPoKT0hVJ1wy2ve6pJ4MSYfhiMxoDq6YBOm-oYKYfBeN22fjqQ"
  }
}
```

**Response Object:**

```json
{
  "complianceCredential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "ParticipantCredential"],
    "id": "https://catalogue.gaia-x.eu/credentials/ParticipantCredential/1664629337488",
    "issuer": "did:web:compliance.gaia-x.eu",
    "issuanceDate": "2022-10-01T13:02:17.489Z",
    "credentialSubject": {
      "id": "did:web:compliance.gaia-x.eu",
      "hash": "3280866b1b8509ce287850fb113dc76d1334959c759f82a57415164d7a3a4026"
    },
    "proof": {
      "type": "JsonWebSignature2020",
      "created": "2022-10-01T13:02:17.489Z",
      "proofPurpose": "assertionMethod",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..YQAIjkqX6OL4U3efV0zumn8-l8c4wQo98SOSlzt53HOR8qlLu5L5lmwZJnAsR7gKW-6jv5GBT0X4ORQ1ozLvihFj6eaxxJNgzLFPoH5w9UEaEIO8mMGyeQ-YQYWBbET3IK1mcHm2VskEsvpLvQGnk6kYJCXJzmaHMRSF3WOjNq_JWN8g-SldiGhgfKsJvIkjCeRm3kCt_UVeHMX6SoLMFDjI8JVxD9d5AG-kbK-xb13mTMdtbcyBtBJ_ahQcbNaxH-CfSDTSN51szLJBG-Ok-OlMagHY_1dqViXAKl4T5ShoS9fjxQItJvFPGA14axkY6s00xKVCUusi31se6rxC9g",
      "verificationMethod": "did:web:compliance.gaia-x.eu"
    }
  }
}
```

#### Step 4 - Finalize your signed Self Description

Add the `complianceCredential` property to your `.json`. The `selfDescription` and your `proof` will be grouped as `selfDescriptionCredential`. Your `.json` file should now have 2 properties:

1. `selfDescriptionCredential` - The Self Description signed by its creator.
2. `complianceCredential` - The signature of the Gaia-X compliance service (its presence means that the Self Description complies with the given rule set by the Trust Framework and the Self Description was signed by a trusted entity)

The final result should look like this:

**Example of complete signed Participant Self Description, verified and signed by the compliance service**

```json
{
  "selfDescriptionCredential": {
    "@context": ["https://www.w3.org/2018/credentials/v1", "https://registry.gaia-x.eu/v2206/api/shape"],
    "type": ["VerifiableCredential", "LegalPerson"],
    "id": "https://compliance.gaia-x.eu/.well-known/participant.json",
    "issuer": "did:web:compliance.gaia-x.eu",
    "issuanceDate": "2022-09-23T23:23:23.235Z",
    "credentialSubject": {
      "id": "did:web:compliance.gaia-x.eu",
      "gx-participant:name": "Gaia-X AISBL",
      "gx-participant:legalName": "Gaia-X European Association for Data and Cloud AISBL",
      "gx-participant:registrationNumber": {
        "gx-participant:registrationNumberType": "local",
        "gx-participant:registrationNumberNumber": "0762747721"
      },
      "gx-participant:headquarterAddress": {
        "gx-participant:addressCountryCode": "BE",
        "gx-participant:addressCode": "BE-BRU",
        "gx-participant:streetAddress": "Avenue des Arts 6-9",
        "gx-participant:postalCode": "1210"
      },
      "gx-participant:legalAddress": {
        "gx-participant:addressCountryCode": "BE",
        "gx-participant:addressCode": "BE-BRU",
        "gx-participant:streetAddress": "Avenue des Arts 6-9",
        "gx-participant:postalCode": "1210"
      },
      "gx-participant:termsAndConditions": "70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700"
    },
    "proof": {
      "type": "JsonWebSignature2020",
      "created": "2022-10-01T13:02:09.771Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "did:web:compliance.gaia-x.eu",
      "jws": "eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..XQqRvvuxW1xHUy_eRzOk4LwyjwlRofg0JBiO0nrWGHAjwMA87OVJ37mB6GylgEttEaUjXQV-QmbGfEnE-YQf5S7B-id9Lld-CC-vW8M-2EvXh3oQp3l5W35mvvdVQXBj16LLskQZpfZGRHM0hn7zGEw24fDc_tLaGoNR9LQ6UzmSrHMwFFVWz6XH3RoG-UY0aZDpnAxjpWxUWaa_Jzf65bfNlx2EdSv3kIKKYJLUlQTk0meuFDD23VrkGStQTGQ8GijY3BNo6QWw889tt5YKWtiSZjbDYYHsVCwMzPoKT0hVJ1wy2ve6pJ4MSYfhiMxoDq6YBOm-oYKYfBeN22fjqQ"
    }
  },
  "complianceCredential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "ParticipantCredential"],
    "id": "https://catalogue.gaia-x.eu/credentials/ParticipantCredential/1664629337488",
    "issuer": "did:web:compliance.gaia-x.eu",
    "issuanceDate": "2022-10-01T13:02:17.489Z",
    "credentialSubject": {
      "id": "did:web:compliance.gaia-x.eu",
      "hash": "3280866b1b8509ce287850fb113dc76d1334959c759f82a57415164d7a3a4026"
    },
    "proof": {
      "type": "JsonWebSignature2020",
      "created": "2022-10-01T13:02:17.489Z",
      "proofPurpose": "assertionMethod",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..YQAIjkqX6OL4U3efV0zumn8-l8c4wQo98SOSlzt53HOR8qlLu5L5lmwZJnAsR7gKW-6jv5GBT0X4ORQ1ozLvihFj6eaxxJNgzLFPoH5w9UEaEIO8mMGyeQ-YQYWBbET3IK1mcHm2VskEsvpLvQGnk6kYJCXJzmaHMRSF3WOjNq_JWN8g-SldiGhgfKsJvIkjCeRm3kCt_UVeHMX6SoLMFDjI8JVxD9d5AG-kbK-xb13mTMdtbcyBtBJ_ahQcbNaxH-CfSDTSN51szLJBG-Ok-OlMagHY_1dqViXAKl4T5ShoS9fjxQItJvFPGA14axkY6s00xKVCUusi31se6rxC9g",
      "verificationMethod": "did:web:compliance.gaia-x.eu"
    }
  }
}
```

### Verify Self Descriptions

The Compliance Service also offers a verify endpoint to verify signed Self Descriptions to check if they conform with the Gaia-X Trust Framework. It will check the shape, content of the Self Description and signature. If there is a mistake in the Self Description, the result will contain all errors so that you can fix them appropriately. An empty array of results is returned if the check conforms.

```bash
curl -X POST 'https://compliance.gaia-x.eu/v2206/api/participant/verify/raw' -H "Content-Type: application/json" --data-raw  -d "@signed-participant-sd.json"
```

```json
{
  "conforms": true,
  "shape": {
    "conforms": true,
    "results": []
  },
  "content": {
    "conforms": true,
    "results": []
  },
  "validSignature": true
}
```

## How to setup certificates

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

After uplaoding your certificate chain you can head to the [Self Description signer tool](https://github.com/deltaDAO/self-description-signer). There you can sign your SD and generate a `did.json` which also needs to be uploaded to `your-domain.com/.well-known/`.

## Using self-issued certificates for local testing

This chapter enables you to validate and sign your self-signed self-descriptions with a locally running Compliance Service instance.

> **IMPORTANT**: Self-issued certificates which don't include a Gaia-X endorsed trust-anchor in their certificate-chain are **NOT** supported in production. This guide is for local testing ONLY. It can be used to check the conformity of self-descriptions.

> To simplify the local testing setup we will generate one certificate which will be used for both (signing your self-secription and signing in the name of your local compliance service). Usually these are seperated, but this allows you to skip locally hosting your `did.json` since we will use the one of the compliance service.

### Step 1: Generating a certificate

Generate a new key/certificate pair:

```bash
$ openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -sha256 -days 365
```

Convert the private key format to `pkcs8` (thats the needed format for the compliance service):

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



WARNING: **NEVER** set these 3 variable in production, these are for **LOCAL TESTING ONLY**!

```
NODE_TLS_REJECT_UNAUTHORIZED='0'
LOCAL_HTTPS='true'
DISABLE_SIGNATURE_CHECK='true'
```

- `NODE_TLS_REJECT_UNAUTHORIZED` allows the app to call self-signed https-urls.

- `LOCAL_HTTPS` enables the use of https for local development (needed for did:web resolver)

- `DISABLE_SIGNATURE_CHECK` will disable the registry call to check the certificate chain for a valid trust-anchor (all certificates will always be seen as valid in this regard)

  

Copy the certificate from `cert.pem` into `gx-compliance/src/static/.well-known/x509CertificateChain.pem`. Replace the the existing certificate chain with the generated `cert.pem`.



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

If you know what you are doing you can manually perform the signing process. For everyone else it's recommended to use the [self-description signer tool](https://github.com/deltaDAO/self-description-signer).

How to set signer tool environment variables:

- `PRIVATE_KEY` = copy `pk8key.pem` content
- `CERTIFICATE ` = copy `cert.pem` content
- `VERIFICATION_METHOD` = `did:web:localhost%3A3000` (assuming port `3000` for the compliance service, you have to encode `:` as `%3A`)
- `X5U_URL` = `https://localhost:3000/.well-known/x509CertificateChain.pem`
- `BASE_URL` = `https://localhost:3000`

More information about the signer can be found in the README.md of the signer-tool.

For now you can ignore the generated `did.json` since we are using for simplicity reasons the `did.json` of the compliance service also for the self-description. Usually you would host it under your own domain together with the `x509CertificateChain.pem` in the `.well-known/` directory.



Now you should have your self description signed by yourself. If you've used the signer-tool, you already have the complete self description as well which is signed by the compliance service. 

If you only have the self-signed self-description you can head to `https://localhost:3000/docs/#/Common/CommonController_signSelfDescription`

to let the compliance service sign your self-description.

### Step 4: Verify your signed self-description 

Assuming a complete self-description(self-signed + signed by the compliance service), you can now verify the whole SD using the [/api/participant/verify/raw](https://localhost:3000/docs/#/Participant/ParticipantController_verifyParticipantRaw) route.

The response body should like like this:

```json
{
  "conforms": true,
  "shape": {
    "conforms": true,
    "results": []
  },
  "isValidSignature": true,
  "content": {
    "conforms": true,
    "results": []
  }
}
```

Keep in mind, the signed SD **will NOT work with the production compliance service**, since the trust-anchor is missing in the certificate chain.

## Get Started With Development

- This application is based on [nest.js](https://nestjs.com/) and TypeScript.
- The nest.js documentation can be found [here](https://docs.nestjs.com/).

### Branch structure explained

Version 2204 and 2206 got split into different branches. Version 2206 will soon be the main version. Here a quick rundown on the current branches:

- `main` - current stable (will be replaced by `2206-main`)
- `development` - switch to version 2206 is happening soon, so fork from `2206-development` instead as it will replace development
- `2206-main` - main branch of version 2206 (currently under development)
- `2206-development` - development branch of version 2206 **(fork from here for MRs)**
- `2204-main` - main branch of version 2204 (under refactoring - use main instead)
- `2204-deveopment` - development branch of version 2204

### Setup environment variables

Don't forget to setup your `.env` file in the project's root directory. An example file can also be found in the root directory (`example.env`). Copy this file and adjust the values.

```bash
$ cp example.env .env
```

- **x509** - your compliance service certificate
- **x509privateKey** - your compliance service private key (needed to sign verified Self Descriptions)
- **REGISTRY_URL** - link to your hosted registry or any other trusted registry. E.g. `https://registry.gaia-x.eu`
- **BASE_URL** - the url of the location for the compliance service. This is used to generate the did:web of the complaince service instance. E.g. `http://localhost:3000`

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

### Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
