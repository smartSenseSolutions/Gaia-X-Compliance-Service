import canonicalize from 'canonicalize'
import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { CompliantCredentialSubjectDto } from '../dto/compliant-credential-subject.dto'
import { HashingUtils } from '../utils/hashing.utils'
import { ComplianceCredentialMapper } from './compliance-credential.mapper'

describe('ComplianceCredentialMapper', () => {
  let complianceCredentialMapper: ComplianceCredentialMapper

  beforeEach(() => {
    complianceCredentialMapper = new ComplianceCredentialMapper()
  })

  it('should map a verifiable credential to a compliance credential', () => {
    const verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto> = {
      id: 'did:web:gaia-x.eu#test-verifiable-credential',
      type: ['VerifiableCredential'],
      '@context': undefined,
      credentialSubject: {
        id: 'did:web:gaia-x.eu#test-credential-subject',
        type: 'gx:LegalParticipant'
      },
      issuanceDate: '',
      issuer: '',
      proof: undefined
    }

    const result: CompliantCredentialSubjectDto = complianceCredentialMapper.map(verifiableCredential)

    expect(result).toEqual({
      type: 'gx:compliance',
      id: verifiableCredential.id ?? verifiableCredential['@id'],
      'gx:integrity': `sha256-${HashingUtils.sha256(canonicalize(verifiableCredential))}`,
      'gx:integrityNormalization': 'RFC8785:JCS',
      'gx:version': '22.10',
      'gx:type': 'gx:LegalParticipant'
    })
  })

  it('should map a verifiable credential with multiple credential subject types to a compliance credential', () => {
    const verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto> = {
      id: 'did:web:gaia-x.eu#test-verifiable-credential',
      type: ['VerifiableCredential'],
      '@context': undefined,
      credentialSubject: {
        id: 'did:web:gaia-x.eu#test-credential-subject',
        type: ['gx:LegalParticipant', 'gx:AnotherLegalParticipant']
      },
      issuanceDate: '',
      issuer: '',
      proof: undefined
    }

    const result: CompliantCredentialSubjectDto = complianceCredentialMapper.map(verifiableCredential)

    expect(result).toEqual({
      type: 'gx:compliance',
      id: verifiableCredential.id ?? verifiableCredential['@id'],
      'gx:integrity': `sha256-${HashingUtils.sha256(canonicalize(verifiableCredential))}`,
      'gx:integrityNormalization': 'RFC8785:JCS',
      'gx:version': '22.10',
      'gx:type': 'gx:LegalParticipant,gx:AnotherLegalParticipant'
    })
  })
})
