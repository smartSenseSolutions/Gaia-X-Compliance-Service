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
    'gx-participant': 'https://registry.gaia-x.eu/api/v2206/shape/files?file=participant&type=ttl#',
    credentialSubject: '@nest'
  },
  '@type': 'gx-participant:LegalPerson'
}

export const EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE = {
  '@context': {
    sh: 'http://www.w3.org/ns/shacl#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    'gx-participant': 'https://registry.gaia-x.eu/api/v2206/shape/files?file=participant&type=ttl#',
    'gx-resource': 'https://registry.gaia-x.eu/api/v2206/shape/files?file=resource&type=ttl#',
    'gx-service-offering': 'https://registry.gaia-x.eu/api/v2206/shape/files?file=service-offering&type=ttl#',
    credentialSubject: '@nest'
  },
  '@type': 'gx-service-offering:ServiceOffering'
}
