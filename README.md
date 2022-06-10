<h1 align="center">Gaia-X Lab Compliance Service</h1>

**Table of Contents**

- [Gaia-X Trust Framework](#gaia-x-trust-framework)
  - [Gaia-X Lab Compliance Service](#gaia-x-lab-compliance-service)
- [Get Started Using the API](#get-started-using-the-api)
  - [How to create Gaia-X compliant Self Descriptions](#how-to-create-gaia-x-compliant-self-descriptions)
    - [Step 1 - Create your Participant Self Description](#step-1---create-your-participant-self-description)
    - [Step 2 - Sign your Participant Self Description](#step-2---sign-your-participant-self-description)
    - [Step 3 - Use the Compliance Service to verify and sign your Self Description](#step-3---use-the-compliance-service-to-verify-and-sign-your-self-description)
    - [Step 4 - Finalize your signed Self Description](#step-4---finalize-your-signed-self-description)
  - [Verify Self Descriptions](#verify-self-descriptions)
- [Get Started With Development](#get-started-with-development)
  - [Installation](#installation)
  - [Running the app](#running-the-app)
  - [Test](#test)

## Gaia-X Trust Framework

For Gaia-X to ensure a higher and unprecedented level of trust in digital platforms, we need to make trust an easy to understand and adopted principle. For this reason, Gaia-X developed a Trust Framework – formerly known as Gaia-X Compliance and Labelling Framework that safeguards data protection, transparency, security, portability, and flexibility for the ecosystem as well as sovereignty and European Control.

The Trust Framework is the set of rules that define the minimum baseline to be part of the Gaia-X Ecosystem. Those rules ensure a common governance and the basic levels of interoperability across individual ecosystems while letting the users in full control of their choices.

In other words, the Gaia-X Ecosystem is the virtual set of participants and service offerings following the requirements from the Gaia-X Trust Framework.

### Gaia-X Lab Compliance Service

The Compliance Service validates the shape, content and credentials of Self Descriptions. Required fields and consistency rules are defined in the [Trust Framework](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/).

## Get Started Using the API

- You can find the Swagger API documentation at `localhost:3000/docs/` or https://compliance.lab.gaia-x.eu/docs/
- The API routes are versioned to prevent breaking changes. The version is alway included in the urls: `/api/v{versionNumber}/` (example: `/api/v1/participant/verify`)

### How to create Gaia-X compliant Self Descriptions

#### Step 1 - Create your Participant Self Description

A Participant is a Legal Person or Natural Person, which is identified, onboarded and has a Gaia-X Self-Description. Instances of Participant neither being a legal nor a natural person are prohibited. See details in the [Architecture Document](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/participant/).

You can use the Self Descriptions in the [test folder](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/feat/participant-verification/src/tests/fixtures) as a starting point.

> hint: You can use the same guide to create a Service Offering Self Description

```json
// Example Participant Self Description
{
  "selfDescription": {
    "@context": {
      "sh": "http://www.w3.org/ns/shacl#",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "gx-participant": "http://w3id.org/gaia-x/participant#"
    },
    "@id": "http://example.org/participant-dp6gtq7i75lmk9p4j2tfg",
    "@type": "gx-participant:LegalPerson",
    "gx-participant:registrationNumber": {
      "@type": "xsd:string",
      "@value": "DEANY1234NUMBER"
    },
    "gx-participant:legalAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    },
    "gx-participant:headquarterAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    }
  }
}
```

#### Step 2 - Sign your Participant Self Description

Self Descriptions need to be signed by a key that registered in a Trust Anchor endorsed by Gaia-X. Validity of keys is checked via the Gaia-X Registry.

To normalize your Self Description you can use the `/normalize` route of the API. URDNA2015 is used for normalization. This will ensure consistency of the hashing process.

```bash
curl -X POST 'https://compliance.lab.gaia-x.eu/api/v1/normalize' -H "Content-Type: application/json" --data-raw  -d "@self-description.json"
```

The normalized Self Description should then be hashed with `sha256(normalizeSd)`. This hash can now be signed with your key resulting in a `jws`. Create a `proof` property with your signature and signing method.

```json
// proof object (signature of the Self Description creator)
{
  "proof": {
    "type": "JsonWebKey2020",
    "created": "2022-06-09T21:48:12.288Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.lab.gaia-x.eu",
    "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..t_UEs8yG-XXXXXXXXXXX"
  }
}
```

Add the `proof` property with your signature to your json.

```json
// Example SD with added proof object
{
  "selfDescription": {
    "@context": {
      "sh": "http://www.w3.org/ns/shacl#",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "gx-participant": "http://w3id.org/gaia-x/participant#"
    },
    "@id": "http://example.org/participant-dp6gtq7i75lmk9p4j2tfg",
    "@type": "gx-participant:LegalPerson",
    "gx-participant:registrationNumber": {
      "@type": "xsd:string",
      "@value": "DEANY1234NUMBER"
    },
    "gx-participant:legalAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    },
    "gx-participant:headquarterAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    }
  },
  "proof": {
    "type": "JsonWebKey2020",
    "created": "2022-06-09T21:48:12.288Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.lab.gaia-x.eu",
    "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..t_UEs8yG-XXXXXXXXXXX"
  }
}
```

#### Step 3 - Use the Compliance Service to verify and sign your Self Description

Head over to https://compliance.lab.gaia-x.eu/docs/ and use the `/sign` route to sign your Self Description. The Compliance Service will sign the Self Description if it complies with the Gaia-X Compliance rules and if your provided proof is valid and return a Self Description including a new `complianceCredential` property.

**Request:**

```bash
curl -X POST 'https://compliance.lab.gaia-x.eu/api/v1/sign' -H "Content-Type: application/json" --data-raw  -d "@participant-sd-minimal.json"
```

```json
// participant-sd-minimal.json
{
  "selfDescription": {
    "@context": {
      "sh": "http://www.w3.org/ns/shacl#",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "gx-participant": "http://w3id.org/gaia-x/participant#"
    },
    "@id": "http://example.org/participant-dp6gtq7i75lmk9p4j2tfg",
    "@type": "gx-participant:LegalPerson",
    "gx-participant:registrationNumber": {
      "@type": "xsd:string",
      "@value": "DEANY1234NUMBER"
    },
    "gx-participant:legalAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    },
    "gx-participant:headquarterAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    }
  },
  "proof": {
    "type": "JsonWebKey2020",
    "created": "2022-06-09T21:48:12.288Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.lab.gaia-x.eu",
    "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..t_UEs8yG-XXXXXXXXXXX"
  }
}
```

**Response Object:**

```json
{
  "complianceCredential": {
    "credentialSubject": {
      "id": "http://example.org/participant-dp6gtq7i75lmk9p4j2tfg",
      "hash": "0859337843c6122da161810c6ff101a399585a81ca1713025df368ab5fceedff"
    },
    "proof": {
      "type": "JsonWebKey2020",
      "created": "2022-06-10T07:00:54.107Z",
      "proofPurpose": "assertionMethod",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..OFpDKHoRY-XXXX",
      "verificationMethod": "did:web:compliance.lab.gaia-x.eu"
    }
  }
}
```

#### Step 4 - Finalize your signed Self Description

Add the `complianceCredential` property to your `.json`. The `selfDescription` and your `proof` will be grouped as `selfDescriptionCredential`. Your `.json` file should now have 2 properties:

1. `selfDescriptionCredential`
   1. `selfDescription` - The Self Description
   2. `proof` - The signature of the creator of the Self Description
2. `complianceCredential` - The signature of the Gaia-X compliance service (its presence ensures the structure of the Self Description complies and the Self Description was signed by a trusted entity)

**The final result should look like this:**

```json
// Complete signed Participant Self Description
{
  "selfDescriptionCredential": {
    "selfDescription": {
      "@context": {
        "sh": "http://www.w3.org/ns/shacl#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "gx-participant": "http://w3id.org/gaia-x/participant#"
      },
      "@id": "http://example.org/participant-dp6gtq7i75lmk9p4j2tfg",
      "@type": "gx-participant:LegalPerson",
      "gx-participant:registrationNumber": {
        "@type": "xsd:string",
        "@value": "DEANY1234NUMBER"
      },
      "gx-participant:headquarterAddress": {
        "@type": "gx-participant:Address",
        "gx-participant:country": {
          "@type": "xsd:string",
          "@value": "DEU"
        }
      },
      "gx-participant:legalAddress": {
        "@type": "gx-participant:Address",
        "gx-participant:country": {
          "@type": "xsd:string",
          "@value": "DEU"
        }
      }
    },
    "proof": {
      "type": "JsonWebKey2020",
      "created": "2022-06-09T21:15:57.827Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "did:web:compliance.lab.gaia-x.eu",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..t_UEs8yG-XXXXXXXXXXX"
    }
  },
  "complianceCredential": {
    "credentialSubject": {
      "id": "http://example.org/participant-dp6gtq7i75lmk9p4j2tfg",
      "hash": "0859337843c6122da161810c6ff101a399585a81ca1713025df368ab5fceedff"
    },
    "proof": {
      "type": "JsonWebKey2020",
      "created": "2022-06-10T07:00:54.107Z",
      "proofPurpose": "assertionMethod",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..OFpDKHoRY-XXXX",
      "verificationMethod": "did:web:compliance.lab.gaia-x.eu"
    }
  }
}
```

### Verify Self Descriptions

The Compliance Service also offers a verify endpoint to verify signed Self Descriptions to check if they conform with the Gaia-X Trust Framework. It will check the shape, content of the Self Description and signature. If there is a mistake in the Self Description, the result will contain all errors so that you can fix them appropriately. An empty array of results is returned if the check conforms.

```bash
curl -X POST 'https://compliance.lab.gaia-x.eu/api/v1/participant/verify/raw' -H "Content-Type: application/json" --data-raw  -d "@signed-participant-sd-minimal.json"
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
