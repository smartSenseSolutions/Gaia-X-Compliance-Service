export const METHOD_IDS = [
  'did:web:compliance.gaia-x.eu#JWK2020-RSA',
  'did:web:compliance.gaia-x.eu#X509-JWK2020',
  'did:web:compliance.lab.gaia-x.eu#JWK2020-RSA',
  'did:web:compliance.lab.gaia-x.eu#X509-JWK2020'
]

export const SUPPORTED_TYPES = ['LegalPerson', 'ServiceOfferingExperimental']

export const DID_WEB_PATTERN = /^(did:web:)([a-zA-Z0-9%._-]*:)*[a-zA-Z0-9%._-]+$/

export const EXPECTED_PARTICIPANT_CONTEXT_TYPE = {
  '@context': {
    sh: 'http://www.w3.org/ns/shacl#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    'gx-participant': 'http://w3id.org/gaia-x/participant#',
    credentialSubject: '@nest'
  },
  '@type': 'gx-participant:LegalPerson'
}

export const EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE = {
  '@context': {
    sh: 'http://www.w3.org/ns/shacl#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    'gx-participant': 'http://w3id.org/gaia-x/participant#',
    'gx-resource': 'http://w3id.org/gaia-x/resource#',
    'gx-service-offering': 'http://w3id.org/gaia-x/service-offering#',
    credentialSubject: '@nest'
  },
  '@type': 'gx-service-offering:ServiceOffering'
}
