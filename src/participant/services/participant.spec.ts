import { Test, TestingModule } from '@nestjs/testing'
import { ParticipantService } from './participant.service'
import { ParticipantSDParserPipe } from '../pipes/participant-sd-parser.pipe'

// Fixtures
import ParticipantSDFixture from '../../tests/fixtures/participant-sd.json'
import ParticipantSDMinimalFixture from '../../tests/fixtures/participant-sd-minimal.json'
import ParticipantSDFaultyFixture from '../../tests/fixtures/participant-sd-faulty.json'
import { expectedErrorResult, expectedValidResult } from '../../common/services/shacl.spec'
import { ParticipantModule } from '../participant.module'
import { AppModule } from '../../app.module'

describe('ParticipantService', () => {
  let participantShaclService: ParticipantService

  const transformPipe = new ParticipantSDParserPipe()

  const expectedValidSDResult = expect.objectContaining({
    conforms: true,
    shape: expectedValidResult,
    content: expectedValidResult,
    isValidSignature: true
  })

  const expectedErrorSDResult = expect.objectContaining({
    conforms: false,
    shape: expectedErrorResult,
    content: expectedErrorResult,
    isValidSignature: false
  })

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ParticipantModule]
    }).compile()

    participantShaclService = moduleRef.get<ParticipantService>(ParticipantService)
  })

  describe.skip(`Validation of Participant Self Descriptions`, () => {
    it('Validates a correct minimal participant self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ParticipantSDMinimalFixture as any)
      const resultMinimal = await participantShaclService.validate(pipedSelfDescription)

      expect(resultMinimal).toEqual(expectedValidSDResult)
    })
    it('Validates a correct participant self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ParticipantSDFixture as any)
      const result = await participantShaclService.validate(pipedSelfDescription)

      expect(result).toEqual(expectedValidSDResult)
    })
    it('Failes validation for a faulty participant self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ParticipantSDFaultyFixture as any)
      const resultFaulty = await participantShaclService.validate(pipedSelfDescription)

      expect(resultFaulty).toEqual(expectedErrorSDResult)
    })
  })
})
