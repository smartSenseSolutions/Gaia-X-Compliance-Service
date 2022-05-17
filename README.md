## Gaia-X Lab Compliance Service

Trust anchors are Gaia-X endorsed entities responsible for managing certificates to sign claims for compliance. The Compliance Service can validate shapes of self-descriptions and sign valid self-descriptions.

## How To Use

The Compliance Service will validate the shape and content of Self Descriptions. Required fields and consistency rules are defined in the [Trust Framework](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/trust_anchors/).

You can use the self-descriptions in the [test folder](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/feat/participant-verification/src/tests/fixtures) as a starting point. Once updated, head over to https://compliance.lab.gaia-x.eu/api/ and use the Swagger API to sign your Self Description. The Compliance Service will sign the Self Description if it complies with the rules and return a Self Description including a new `proof` property.

```bash
curl -X POST 'https://compliance.lab.gaia-x.eu/api/v1/participant/signature/sign' -H "Content-Type: application/json" --data-raw  -d "@participant-sd-minimal.json"
```

```json
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
 {
  "proof" : {
    "type": "RsaSignature2018",
    "created": "2022-05-11T20:22:28.885Z",
    "proofPurpose": "assertionMethod",
    "jws": "-----BEGIN PUBLIC KEY-----EXAMPLE-kqhkiG9w0EXAMPLEIIBCgKCAQEAxHETEXAMPLEuc-----END PUBLIC KEY-----",
    "verifcationMethod": "eyEXAMPLEJhbGciONiJ9.eyEXAMPLEpcHRpb24iOnsiQGNvb.SsXt1EXAMPLEn748nasQ11"
  }
 }
}
```

The Compliance Service also offers a verify endpoint to verify signed Self Descriptions to get insights if they conform with the Gaia-X Trust Framework. It will check the shape, content of the Self Description and signature. If there is a mistake in the Self Description, the result will contain all errors so that you can fix them appropriately. An empty array of results is returned if the check conforms.

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

> hint: Currently, the Compliance Service only supports Self Descriptions for Participants.

## Development

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
