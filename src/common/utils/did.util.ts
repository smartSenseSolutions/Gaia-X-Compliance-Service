import * as jose from 'jose'
import { writeFileSync } from 'fs'
import { KeyLike } from 'jose'
import { join } from 'path'

export const X509_VERIFICATION_METHOD_NAME = 'X509-JWK2020'
export const DID_DOC_FILE_PATH_WK = join(__dirname, '../../static/.well-known/did.json')
export const DID_DOC_FILE_PATH = join(__dirname, '../../static/did.json')

export function getDidWeb() {
  return `did:web:${process.env.BASE_URL.replace(/http[s]?:\/\//, '')
    .replace(':', '%3A') // encode port ':' as '%3A' in did:web
    .replace(/\//g, ':')}`
}
export function getCertChainUri() {
  return `${process.env.BASE_URL}/.well-known/x509CertificateChain.pem`
}

export async function createDidDocument(x509Certificate: KeyLike, signingAlg: string) {
  const x509VerificationMethodIdentifier = `${getDidWeb()}#${X509_VERIFICATION_METHOD_NAME}`

  const DID_DOC = {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
    id: getDidWeb(),
    verificationMethod: [
      {
        '@context': 'https://w3c-ccg.github.io/lds-jws2020/contexts/v1/',
        id: x509VerificationMethodIdentifier,
        type: 'JsonWebKey2020',
        controller: getDidWeb(),
        publicKeyJwk: {
          ...(await jose.exportJWK(x509Certificate)),
          alg: signingAlg,
          x5u: getCertChainUri()
        }
      }
    ],
    assertionMethod: [x509VerificationMethodIdentifier]
  }
  writeFileSync(DID_DOC_FILE_PATH, JSON.stringify(DID_DOC))
  writeFileSync(DID_DOC_FILE_PATH_WK, JSON.stringify(DID_DOC))
}
