import { Test, TestingModule } from '@nestjs/testing'
import { VpParserService } from './vp-parser.service'
import { VerifiableCredentialDto, CredentialSubjectDto } from '../dto'
import ParticipantGoodVcs from '../../tests/fixtures/participant-vcs-correct.json'
import ParticipantmissingTc from '../../tests/fixtures/participant-vcs-missing-t&c.json'
import ParticipantmissingRN from '../../tests/fixtures/participant-vcs-missing-rn.json'
import SOGoodVcs from '../../tests/fixtures/so-vcs-correct.json'
import SOmissingCC from '../../tests/fixtures/so-vcs-missing-compliance-cred.json'
import { CommonModule } from '../common.module'
import { HttpModule } from '@nestjs/axios'

describe('Initialization VP Parser', () => {
  let service: VpParserService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [VpParserService]
    }).compile()

    service = module.get<VpParserService>(VpParserService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return an error when there is no Participant VC or ServiceOffering VC', async () => {
    try {
      const participant_vcs = await service.parseVP([])
      fail()
    } catch (e) {
      expect(e).toBeTruthy
      expect(e.status).toEqual(409)
      expect(e.message).toContain('Invalid Payload, missing Participant VC or Service-Offering VC')
    }
  })

  describe('Testing parser for Participant VP', () => {
    it('should return an array of 3 vcs when the payload is correct', async () => {
      const participant_vcs = await service.parseVP(ParticipantGoodVcs as VerifiableCredentialDto<CredentialSubjectDto>[])
      expect(participant_vcs.length).toBeGreaterThan(2)
      expect(participant_vcs[0].type.includes('VerifiableCredential'))
    })
    it('should return missing Registration number VC when the VC is not in the payload', async () => {
      try {
        const participant_vcs = await service.parseVP(ParticipantmissingRN as VerifiableCredentialDto<CredentialSubjectDto>[])
        fail()
      } catch (e) {
        expect(e).toBeTruthy
        expect(e.status).toEqual(409)
        expect(e.message).toContain('Missing VC of type: RegistrationNumber')
      }
    })
    it('should return missing T&C VC when the VC is not in the payload', async () => {
      try {
        const participant_vcs = await service.parseVP(ParticipantmissingTc as VerifiableCredentialDto<CredentialSubjectDto>[])
        fail()
      } catch (e) {
        expect(e).toBeTruthy
        expect(e.status).toEqual(409)
        expect(e.message).toContain('Missing VC of type: TermsAndCondition')
      }
    })
  })

  describe('Testing parser for ServiceOffering VP', () => {
    it('should return an array of 2 vcs when the payload is correct', async () => {
      const so_vcs = await service.parseVP(SOGoodVcs as VerifiableCredentialDto<CredentialSubjectDto>[])
      expect(so_vcs.length).toBeGreaterThan(1)
      expect(so_vcs[0].type.includes('VerifiableCredential'))
    })
    it('should return missing Participant Credential VC', async () => {
      try {
        const participant_vcs = await service.parseVP(SOmissingCC as VerifiableCredentialDto<CredentialSubjectDto>[])
        fail()
      } catch (e) {
        expect(e).toBeTruthy
        expect(e.status).toEqual(409)
        expect(e.message).toContain('Missing VC of type: ParticipantCredential')
      }
    })
  })
})
