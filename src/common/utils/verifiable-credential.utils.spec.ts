import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { VerifiableCredentialUtils } from './verifiable-credential.utils'

describe('VerifiableCredentialUtils', () => {
  it('should return a list of Gaia-X types when credential subject is an array', () => {
    const verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto> = {
      '@context': undefined,
      issuanceDate: '',
      issuer: '',
      proof: undefined,
      id: 'did:web:gaia-x.eu#test-verifiable-credential',
      type: ['VerifiableCredential'],
      credentialSubject: [
        {
          id: 'did:web:gaia-x.eu#test-credential-subject-1',
          type: 'gx:LegalParticipant'
        },
        {
          id: 'did:web:gaia-x.eu#test-credential-subject-1',
          type: ['gx:TermsAndConditions', 'gx:AnotherTermsAndConditions']
        }
      ]
    }

    expect(VerifiableCredentialUtils.extractGxTypes(verifiableCredential)).toEqual([
      'gx:LegalParticipant',
      'gx:TermsAndConditions',
      'gx:AnotherTermsAndConditions'
    ])
  })

  it('should return an empty list when credential subjects are undefined/null', () => {
    const verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto> = {
      '@context': undefined,
      issuanceDate: '',
      issuer: '',
      proof: undefined,
      id: 'did:web:gaia-x.eu#test-verifiable-credential',
      type: ['VerifiableCredential'],
      credentialSubject: [undefined, null]
    }

    expect(VerifiableCredentialUtils.extractGxTypes(verifiableCredential)).toEqual([])
  })

  it('should return an empty list when credential subject is undefined', () => {
    const verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto> = {
      '@context': undefined,
      issuanceDate: '',
      issuer: '',
      proof: undefined,
      id: 'did:web:gaia-x.eu#test-verifiable-credential',
      type: ['VerifiableCredential'],
      credentialSubject: undefined
    }

    expect(VerifiableCredentialUtils.extractGxTypes(verifiableCredential)).toEqual([])
  })

  it('should return a single item list', () => {
    const verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto> = {
      '@context': undefined,
      issuanceDate: '',
      issuer: '',
      proof: undefined,
      id: 'did:web:gaia-x.eu#test-verifiable-credential',
      type: ['VerifiableCredential'],
      credentialSubject: {
        id: 'did:web:gaia-x.eu#test-credential-subject',
        type: 'gx:LegalParticipant'
      }
    }

    expect(VerifiableCredentialUtils.extractGxTypes(verifiableCredential)).toEqual(['gx:LegalParticipant'])
  })
})
