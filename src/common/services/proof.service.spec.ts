import { Test, TestingModule } from '@nestjs/testing'
import { ProofService } from '.'
import { HttpModule } from '@nestjs/axios'
import { CommonModule } from '../common.module'
import ParticipantSDFixture from '../../tests/fixtures/participant-vp.json'

describe('ProofService', () => {
  let proofService: ProofService
  const sdWithDidKey = ParticipantSDFixture.verifiableCredential[0]

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ProofService]
    }).compile()

    proofService = moduleFixture.get<ProofService>(ProofService)
    sdWithDidKey.proof.verificationMethod = `did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH`
  })

  it('should be defined', () => {
    expect(proofService).toBeDefined()
  })

  it('should be able to load a did:key', () => {
    proofService.getPublicKeys(sdWithDidKey)
  })
})
