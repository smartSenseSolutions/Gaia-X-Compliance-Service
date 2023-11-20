import canonicalize from 'canonicalize'
import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { CompliantCredentialSubjectDto } from '../dto/compliant-credential-subject.dto'
import { HashingUtils } from '../utils/hashing.utils'
import { LabelLevel1CredentialMapper } from './label-level-1-credential.mapper'

describe('LabelLevel1CredentialMapper', () => {
  let complianceCredentialMapper: LabelLevel1CredentialMapper

  beforeEach(() => {
    complianceCredentialMapper = new LabelLevel1CredentialMapper()
  })

  it('should map a service offering label level 1 credential to a compliance credential', () => {
    const verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto> = {
      id: 'did:web:gaia-x.eu#test-verifiable-credential',
      type: ['VerifiableCredential'],
      '@context': undefined,
      credentialSubject: {
        id: 'did:web:gaia-x.eu#test-credential-subject',
        type: 'gx:ServiceOfferingLabelLevel1'
      },
      issuanceDate: '',
      issuer: '',
      proof: undefined
    }

    const result: CompliantCredentialSubjectDto = complianceCredentialMapper.map(verifiableCredential)

    expect(result).toEqual({
      type: 'gx:labelLevel1',
      id: verifiableCredential.id ?? verifiableCredential['@id'],
      'gx:integrity': `sha256-${HashingUtils.sha256(canonicalize(verifiableCredential))}`,
      'gx:integrityNormalization': 'RFC8785:JCS',
      'gx:version': '22.10',
      'gx:type': 'gx:ServiceOfferingLabelLevel1'
    })
  })
})
