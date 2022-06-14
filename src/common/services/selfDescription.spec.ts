import { Test, TestingModule } from '@nestjs/testing'
import { SelfDescriptionService } from './selfDescription.service'
import { SDParserPipe } from '../pipes/sd-parser.pipe'

// Fixtures
import ParticipantSDFixture from '../../tests/fixtures/participant-sd.json'
import ParticipantSDMinimalFixture from '../../tests/fixtures/participant-sd-minimal.json'
import ParticipantSDFaultyFixture from '../../tests/fixtures/participant-sd-faulty.json'
import ServiceOfferingSDFixture from '../../tests/fixtures/service-offering-sd.json'
import ServiceOfferingSDMinimalFixture from '../../tests/fixtures/service-offering-sd-minimal.json'
// import ServiceOfferingSDFaultyFixture from '../../tests/fixtures/service-offering-sd-faulty.json'

import { expectedErrorResult, expectedValidResult } from '../../common/services/shacl.spec'
import { ParticipantModule } from '../../participant/participant.module'
import { AppModule } from '../../app.module'

describe('ParticipantService', () => {
  let selfDescriptionService: SelfDescriptionService

  const transformPipe = new SDParserPipe()

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

    selfDescriptionService = moduleRef.get<SelfDescriptionService>(SelfDescriptionService)
  })

  describe(`Validation of Participant Self Descriptions`, () => {
    it('Validates a correct minimal participant self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ParticipantSDMinimalFixture as any)
      const resultMinimal = await selfDescriptionService.validate(pipedSelfDescription)

      expect(resultMinimal).toEqual(expectedValidSDResult)
    })
    it('Validates a correct participant self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ParticipantSDFixture as any)
      const result = await selfDescriptionService.validate(pipedSelfDescription)

      expect(result).toEqual(expectedValidSDResult)
    })
    it('Failes validation for a faulty participant self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ParticipantSDFaultyFixture as any)
      const resultFaulty = await selfDescriptionService.validate(pipedSelfDescription)

      expect(resultFaulty).toEqual(expectedErrorSDResult)
    })
  })

  describe(`Validation of Service Offering Self Descriptions`, () => {
    it('Validates a correct minimal Service Offering self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ServiceOfferingSDMinimalFixture as any)
      const resultMinimal = await selfDescriptionService.validate(pipedSelfDescription)

      expect(resultMinimal).toEqual(expectedValidSDResult)
    })
    it('Validates a correct Service Offering self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ServiceOfferingSDFixture as any)
      const result = await selfDescriptionService.validate(pipedSelfDescription)

      expect(result).toEqual(expectedValidSDResult)
    })
    it('Failes validation for a faulty Service Offering self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ParticipantSDFaultyFixture as any)
      const result = await selfDescriptionService.validate(pipedSelfDescription)

      expect(result).toEqual(expectedErrorSDResult)
    })
  })
})
