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
- [Get Started With Development](#get-started-with-development)
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

- You can find the Swagger API documentation at `localhost:3000/v2204/docs/` or https://compliance.gaia-x.eu/v2204/docs/
- The API routes are versioned to prevent breaking changes. The version is always included in the urls: `/v{versionNumber}/api/` (example: `/v2204/api/participant/verify`)

### How to create Self Descriptions

#### Step 1 - Create your Participant Self Description

You can use the Self Descriptions in the [test folder](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/main/src/tests/fixtures) as a starting point. See details in the [Architecture Document](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/participant/).

> hint: You can use the same guide to create a Service Offering Self Description

**Example Participant Self Description**

```json
{
  "@context": [
    "http://www.w3.org/ns/shacl#",
    "http://www.w3.org/2001/XMLSchema#",
    "http://w3id.org/gaia-x/participant#",
    "@nest"
  ],
  "@id": "https://compliance.gaia-x.eu/.well-known/participant.json",
  "@type": [
    "VerifiableCredential",
    "LegalPerson"
  ],
  "credentialSubject": {
    "id": "did:compliance.gaia-x.eu",
    "gx-participant:name": {
      "@value": "Gaia-X AISBL",
      "@type": "xsd:string"
    },
    "gx-participant:legalName": {
      "@value": "Gaia-X European Association for Data and Cloud AISBL",
      "@type": "xsd:string"
    },
    "gx-participant:registrationNumber": {
      "@value": "0762747721",
      "@type": "xsd:string"
    },
    "gx-participant:headquarterAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@value": "BE",
        "@type": "xsd:string"
      },
      "gx-participant:street-address": {
        "@value": "Avenue des Arts 6-9",
        "@type": "xsd:string"
      },
      "gx-participant:postal-code": {
        "@value": "1210",
        "@type": "xsd:string"
      },
      "gx-participant:locality": {
        "@value": "Bruxelles/Brussels",
        "@type": "xsd:string"
      }
    },
    "gx-participant:legalAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@value": "BE",
        "@type": "xsd:string"
      },
      "gx-participant:street-address": {
        "@value": "Avenue des Arts 6-9",
        "@type": "xsd:string"
      },
      "gx-participant:postal-code": {
        "@value": "1210",
        "@type": "xsd:string"
      },
      "gx-participant:locality": {
        "@value": "Bruxelles/Brussels",
        "@type": "xsd:string"
      }
    }
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
curl -X POST 'https://compliance.gaia-x.eu/v2204/api/normalize' -H "Content-Type: application/json" --data-raw  -d "@self-description.json"
```

The normalized Self Description should then be hashed with `sha256(normalizeSd)`. This hash can now be signed with your key resulting in a `jws`. Create a `proof` property with your signature and signing method.

**Example proof object (signature of the Self Description creator)**

```json
{
  "proof": {
    "type": "JsonWebKey2020",
    "created": "2022-06-17T07:44:28.488Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.gaia-x.eu",
    "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..t_UEs8yG-XXXXXXXXXXX"
  }
}
```

Add the `proof` object with your signature to your json.

**Example SD with added proof object**

```json
{
  "@context": [
    "http://www.w3.org/ns/shacl#",
    "http://www.w3.org/2001/XMLSchema#",
    "http://w3id.org/gaia-x/participant#",
    "@nest"
  ],
  "@id": "https://compliance.gaia-x.eu/.well-known/participant.json",
  "@type": [
    "VerifiableCredential",
    "LegalPerson"
  ],
  "credentialSubject": {
    "id": "did:compliance.gaia-x.eu",
    "gx-participant:name": {
      "@value": "Gaia-X AISBL",
      "@type": "xsd:string"
    },
    "gx-participant:legalName": {
      "@value": "Gaia-X European Association for Data and Cloud AISBL",
      "@type": "xsd:string"
    },
    "gx-participant:registrationNumber": {
      "@value": "0762747721",
      "@type": "xsd:string"
    },
    "gx-participant:headquarterAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@value": "BE",
        "@type": "xsd:string"
      },
      "gx-participant:street-address": {
        "@value": "Avenue des Arts 6-9",
        "@type": "xsd:string"
      },
      "gx-participant:postal-code": {
        "@value": "1210",
        "@type": "xsd:string"
      },
      "gx-participant:locality": {
        "@value": "Bruxelles/Brussels",
        "@type": "xsd:string"
      }
    },
    "gx-participant:legalAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@value": "BE",
        "@type": "xsd:string"
      },
      "gx-participant:street-address": {
        "@value": "Avenue des Arts 6-9",
        "@type": "xsd:string"
      },
      "gx-participant:postal-code": {
        "@value": "1210",
        "@type": "xsd:string"
      },
      "gx-participant:locality": {
        "@value": "Bruxelles/Brussels",
        "@type": "xsd:string"
      }
    }
  },
  "proof": {
    "type": "JsonWebKey2020",
    "created": "2022-06-17T07:46:45.065Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.lab.gaia-x.eu",
    "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..knqo_G8hFzrXxrHOWNrYiD1v2bsdm7n6D9ekokszpPVp9p1rHNb3GzAW0q5gDdTxoFPUgZes93Gb2DR67ttewMTtoxFSuUfzqYtq584Rx85lSfmircSpR_QJRb1CxjJPZhWogznimujITW26-p9jvzvq-c6JzoduclpYEbb3rq6Eubsl6gVDxAOazJ9zxm4uLwTZTfVLaLAYIiyxhflBHE5Nmh1dRx7sy8fGEkRklZjzIbhjG1py9bo-GISHxzSEwbmxOyRbGzP_fqxLMIXFWHpXycugbY7D2Xnvm3FIH33Rd8KHc7klOXtilD3IaNEdRJIcvjLxRbA-aYW93atO_Q"
  }
}
```

#### Step 3 - Use the Compliance Service to verify and sign your Self Description

Head over to https://compliance.gaia-x.eu/v2204/docs/ and use the `/sign` route to sign your Self Description. The Compliance Service will sign the Self Description if it complies with the rules from the Trust Framework and if your provided proof is valid and return a Self Description including a new `complianceCredential` object.

**Request:**

```bash
curl -X POST 'https://compliance.gaia-x.eu/v2204/api/sign' -H "Content-Type: application/json" --data-raw  -d "@participant-sd.json"
```

**participant-sd.json**

```json
{
  "@context": [
    "http://www.w3.org/ns/shacl#",
    "http://www.w3.org/2001/XMLSchema#",
    "http://w3id.org/gaia-x/participant#",
    "@nest"
  ],
  "@id": "https://compliance.gaia-x.eu/.well-known/participant.json",
  "@type": [
    "VerifiableCredential",
    "LegalPerson"
  ],
  "credentialSubject": {
    "id": "did:compliance.gaia-x.eu",
    "gx-participant:name": {
      "@value": "Gaia-X AISBL",
      "@type": "xsd:string"
    },
    "gx-participant:legalName": {
      "@value": "Gaia-X European Association for Data and Cloud AISBL",
      "@type": "xsd:string"
    },
    "gx-participant:registrationNumber": {
      "@value": "0762747721",
      "@type": "xsd:string"
    },
    "gx-participant:headquarterAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@value": "BE",
        "@type": "xsd:string"
      },
      "gx-participant:street-address": {
        "@value": "Avenue des Arts 6-9",
        "@type": "xsd:string"
      },
      "gx-participant:postal-code": {
        "@value": "1210",
        "@type": "xsd:string"
      },
      "gx-participant:locality": {
        "@value": "Bruxelles/Brussels",
        "@type": "xsd:string"
      }
    },
    "gx-participant:legalAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@value": "BE",
        "@type": "xsd:string"
      },
      "gx-participant:street-address": {
        "@value": "Avenue des Arts 6-9",
        "@type": "xsd:string"
      },
      "gx-participant:postal-code": {
        "@value": "1210",
        "@type": "xsd:string"
      },
      "gx-participant:locality": {
        "@value": "Bruxelles/Brussels",
        "@type": "xsd:string"
      }
    }
  },
  "proof": {
    "type": "JsonWebKey2020",
    "created": "2022-06-17T07:46:45.065Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.lab.gaia-x.eu",
    "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..knqo_G8hFzrXxrHOWNrYiD1v2bsdm7n6D9ekokszpPVp9p1rHNb3GzAW0q5gDdTxoFPUgZes93Gb2DR67ttewMTtoxFSuUfzqYtq584Rx85lSfmircSpR_QJRb1CxjJPZhWogznimujITW26-p9jvzvq-c6JzoduclpYEbb3rq6Eubsl6gVDxAOazJ9zxm4uLwTZTfVLaLAYIiyxhflBHE5Nmh1dRx7sy8fGEkRklZjzIbhjG1py9bo-GISHxzSEwbmxOyRbGzP_fqxLMIXFWHpXycugbY7D2Xnvm3FIH33Rd8KHc7klOXtilD3IaNEdRJIcvjLxRbA-aYW93atO_Q"
  }
}
```

**Response Object:**

```json
{
  "complianceCredential": {
    "@context": [
      "https://www.w3.org/2018/credentials/v1"
    ],
    "@type": [
      "VerifiableCredential",
      "ParticipantCredential"
    ],
    "id": "https://catalogue.gaia-x.eu/credentials/ParticipantCredential/1662139286919",
    "issuer": "did:web:compliance.lab.gaia-x.eu",
    "issuanceDate": "2022-09-02T17:21:26.919Z",
    "credentialSubject": {
      "id": "did:compliance.gaia-x.eu",
      "hash": "9ecf754ffdad0c6de238f60728a90511780b2f7dbe2f0ea015115515f3f389cd"
    },
    "proof": {
      "type": "JsonWebKey2020",
      "created": "2022-09-02T17:21:26.919Z",
      "proofPurpose": "assertionMethod",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..n1DOa8OkXXyD3uxSh30Mhzbj9NOUS7gEoQL-z7STuEc3OSJc3c8M1mCnVeOrkjadcy3XvYTk4UqA5AUNm-M1SufL7XySN8lH6cHfTuMPZ6lEJ5TEoS79nD-K1D9owut7Fo3wDvJEmuTl-hBkTt8GGfHHfxwEvjkDGXJZi4euStEIOWxqvZlYYDcAzUUak5iHAa4NuBoILXYAwjXMwcToqPC7Q-fkpZoYcgqoe5rIBNhMXqrn0wBvvXDIYJsXOtUpo5CddJT2Py77K5krvLws6qMMFf7FnyuZJd83Phd6kkGSp3o5DI-JrfxJa18MwG2aVkG8-_qvPvgalaXjBQ4Wjg",
      "verificationMethod": "did:web:compliance.lab.gaia-x.eu"
    }
  }
}
```

#### Step 4 - Finalize your signed Self Description

Add the `complianceCredential` property to your `.json`. The `selfDescription` and your `proof` will be grouped as `selfDescriptionCredential`. Your `.json` file should now have 2 properties:

1. `selfDescriptionCredential` - The Self Description signed by its creator.
2. `complianceCredential` - The signature of the Gaia-X compliance service (its presence means that the Self Description complies with the given rule set by the Trust Framework and the Self Description was signed by a trusted entity)

The final result should look like this:

**Example of complete signed Participant Self Description**

```json
{
  "selfDescriptionCredential": {
    "@context": [
      "http://www.w3.org/ns/shacl#",
      "http://www.w3.org/2001/XMLSchema#",
      "http://w3id.org/gaia-x/participant#",
      "@nest"
    ],
    "@id": "https://compliance.gaia-x.eu/.well-known/participant.json",
    "@type": [
      "VerifiableCredential",
      "LegalPerson"
    ],
    "credentialSubject": {
      "id": "did:compliance.gaia-x.eu",
      "gx-participant:name": {
        "@value": "Gaia-X AISBL",
        "@type": "xsd:string"
      },
      "gx-participant:legalName": {
        "@value": "Gaia-X European Association for Data and Cloud AISBL",
        "@type": "xsd:string"
      },
      "gx-participant:registrationNumber": {
        "@value": "0762747721",
        "@type": "xsd:string"
      },
      "gx-participant:headquarterAddress": {
        "@type": "gx-participant:Address",
        "gx-participant:country": {
          "@value": "BE",
          "@type": "xsd:string"
        },
        "gx-participant:street-address": {
          "@value": "Avenue des Arts 6-9",
          "@type": "xsd:string"
        },
        "gx-participant:postal-code": {
          "@value": "1210",
          "@type": "xsd:string"
        },
        "gx-participant:locality": {
          "@value": "Bruxelles/Brussels",
          "@type": "xsd:string"
        }
      },
      "gx-participant:legalAddress": {
        "@type": "gx-participant:Address",
        "gx-participant:country": {
          "@value": "BE",
          "@type": "xsd:string"
        },
        "gx-participant:street-address": {
          "@value": "Avenue des Arts 6-9",
          "@type": "xsd:string"
        },
        "gx-participant:postal-code": {
          "@value": "1210",
          "@type": "xsd:string"
        },
        "gx-participant:locality": {
          "@value": "Bruxelles/Brussels",
          "@type": "xsd:string"
        }
      }
    },
    "proof": {
      "type": "JsonWebKey2020",
      "created": "2022-06-17T07:46:45.065Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "did:web:compliance.lab.gaia-x.eu",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..knqo_G8hFzrXxrHOWNrYiD1v2bsdm7n6D9ekokszpPVp9p1rHNb3GzAW0q5gDdTxoFPUgZes93Gb2DR67ttewMTtoxFSuUfzqYtq584Rx85lSfmircSpR_QJRb1CxjJPZhWogznimujITW26-p9jvzvq-c6JzoduclpYEbb3rq6Eubsl6gVDxAOazJ9zxm4uLwTZTfVLaLAYIiyxhflBHE5Nmh1dRx7sy8fGEkRklZjzIbhjG1py9bo-GISHxzSEwbmxOyRbGzP_fqxLMIXFWHpXycugbY7D2Xnvm3FIH33Rd8KHc7klOXtilD3IaNEdRJIcvjLxRbA-aYW93atO_Q"
    }
  },
  "complianceCredential": {
    "@context": [
      "https://www.w3.org/2018/credentials/v1"
    ],
    "@type": [
      "VerifiableCredential",
      "ParticipantCredential"
    ],
    "id": "https://catalogue.gaia-x.eu/credentials/ParticipantCredential/1655452007162",
    "issuer": "did:web:compliance.gaia-x.eu",
    "issuanceDate": "2022-06-17T07:46:47.162Z",
    "credentialSubject": {
      "id": "did:compliance.gaia-x.eu",
      "hash": "9ecf754ffdad0c6de238f60728a90511780b2f7dbe2f0ea015115515f3f389cd"
    },
    "proof": {
      "type": "JsonWebKey2020",
      "created": "2022-06-17T07:46:47.162Z",
      "proofPurpose": "assertionMethod",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..eQrh53oeg-NmnOun_iM3tHH1ZnEnp7IqZmfsBgBPrLreN5F3DI6YxZisLAXToZiuWxOKux19ehRU1vg5gTAx6Zjb6NfHyj8-9AL9EQ4y7oBfhIk-ZIl6WzdkghtmVyp5dZxYTcSqCiSyWMJGrXsCRoxLU4SWAT0VP_bBuQc9joQZSiIUs3rHzyudV-6MLGhv9e9hwKarzZTXxvBCt4uVGm1ycqcr88SmYOxxFKrdLhJig8ttCD6codeNorDMV3VMj89lXOoFBDWSHPs5yEtLuAUu8RrxAwbyPOfbnCMpgbbriMlVlA9NDqdDK58AvirUtVfvWhhnZx0xKhyscVbIVw",
      "verificationMethod": "did:web:compliance.gaia-x.eu"
    }
  }
}

```

### Verify Self Descriptions

The Compliance Service also offers a verify endpoint to verify signed Self Descriptions to check if they conform with the Gaia-X Trust Framework. It will check the shape, content of the Self Description and signature. If there is a mistake in the Self Description, the result will contain all errors so that you can fix them appropriately. An empty array of results is returned if the check conforms.

```bash
curl -X POST 'https://compliance.gaia-x.eu/v2204/api/participant/verify/raw' -H "Content-Type: application/json" --data-raw  -d "@signed-participant-sd.json"
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

The compliance service currently supports [X.509 certificates](https://www.ssl.com/faqs/what-is-an-x-509-certificate/) in Base64 encoding.  You need a certificate authority(CA) which is either a Gaia-X endorsed trust-anchor or owns a certificate signed by one(chain of trust). 

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

## Get Started With Development

- This application is based on [nest.js](https://nestjs.com/) and TypeScript.
- The nest.js documentation can be found [here](https://docs.nestjs.com/).

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
