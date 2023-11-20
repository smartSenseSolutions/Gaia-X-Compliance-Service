import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { ComplianceCredentialMapper } from './compliance-credential.mapper'
import { LabelLevel1CredentialMapper } from './label-level-1-credential.mapper'
import { OutputVerifiableCredentialMapperFactory } from './output-verifiable-credential-mapper.factory'

describe('OutputVerifiableCredentialMapperFactory', () => {
  it('should return a ComplianceCredentialMapper', () => {
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

    expect(OutputVerifiableCredentialMapperFactory.for(verifiableCredential)).toBeInstanceOf(ComplianceCredentialMapper)
  })

  it('should return a ComplianceCredentialMapper when credential subject is an array', () => {
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
          id: 'did:web:gaia-x.eu#test-credential-subject-2',
          type: 'gx:ServiceOfferingLabelLevel1'
        }
      ]
    }

    expect(OutputVerifiableCredentialMapperFactory.for(verifiableCredential)).toBeInstanceOf(ComplianceCredentialMapper)
  })

  it('should return a ComplianceCredentialMapper when credential subject is undefined', () => {
    const verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto> = {
      '@context': undefined,
      issuanceDate: '',
      issuer: '',
      proof: undefined,
      id: 'did:web:gaia-x.eu#test-verifiable-credential',
      type: ['VerifiableCredential'],
      credentialSubject: undefined
    }

    expect(OutputVerifiableCredentialMapperFactory.for(verifiableCredential)).toBeInstanceOf(ComplianceCredentialMapper)
  })

  it('should return a LabelLevel1CredentialMapper when credential subject type is gx:ServiceOfferingLabelLevel1', () => {
    const verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto> = {
      '@context': undefined,
      issuanceDate: '',
      issuer: '',
      proof: undefined,
      id: 'did:web:gaia-x.eu#test-verifiable-credential',
      type: ['VerifiableCredential'],
      credentialSubject: {
        id: 'did:web:gaia-x.eu#test-credential-subject',
        type: 'gx:ServiceOfferingLabelLevel1'
      }
    }

    expect(OutputVerifiableCredentialMapperFactory.for(verifiableCredential)).toBeInstanceOf(LabelLevel1CredentialMapper)
  })

  it('should return a LabelLevel1CredentialMapper when credential subject type is ["gx:ServiceOfferingLabelLevel1"]', () => {
    const verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto> = {
      '@context': undefined,
      issuanceDate: '',
      issuer: '',
      proof: undefined,
      id: 'did:web:gaia-x.eu#test-verifiable-credential',
      type: ['VerifiableCredential'],
      credentialSubject: {
        id: 'did:web:gaia-x.eu#test-credential-subject',
        type: ['gx:ServiceOfferingLabelLevel1']
      }
    }

    expect(OutputVerifiableCredentialMapperFactory.for(verifiableCredential)).toBeInstanceOf(LabelLevel1CredentialMapper)
  })
})
