import { Test, TestingModule } from '@nestjs/testing'
import { ServiceOfferingService } from './service-offering.service'

// Fixtures
import ServiceOfferingSDFixture from '../../tests/fixtures/service-offering-sd.json'
import ServiceOfferingSDMinimalFixture from '../../tests/fixtures/service-offering-sd-minimal.json'
import ServiceOfferingSDFaultyFixture from '../../tests/fixtures/service-offering-sd-faulty.json'
import { expectedErrorResult, expectedValidResult } from '../../common/services/shacl.spec'
import { ServiceOfferingModule } from '../service-offering.module'
import { AppModule } from '../../app.module'
import { ServiceOfferingSDParserPipe } from '../pipes/service-offering-sd-parser.pipe'

describe('ServiceOfferingService', () => {
  let serviceOfferingShaclService: ServiceOfferingService

  const transformPipe = new ServiceOfferingSDParserPipe()

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
      imports: [AppModule, ServiceOfferingModule]
    }).compile()

    serviceOfferingShaclService = moduleRef.get<ServiceOfferingService>(ServiceOfferingService)
  })

  describe(`Validation of Service Offering Self Descriptions`, () => {
    it.skip('Validates a correct minimal Service Offering self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ServiceOfferingSDMinimalFixture as any)
      const resultMinimal = await serviceOfferingShaclService.validate(pipedSelfDescription)

      expect(resultMinimal).toEqual(expectedValidSDResult)
    })
    it('Validates a correct Service Offering self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ServiceOfferingSDFixture as any)
      const result = await serviceOfferingShaclService.validate(pipedSelfDescription)

      expect(result).toEqual(expectedValidSDResult)
    })
    it.skip('Failes validation for a faulty Service Offering self description', async () => {
      const pipedSelfDescription = transformPipe.transform(ServiceOfferingSDFaultyFixture as any)
      const resultFaulty = await serviceOfferingShaclService.validate(pipedSelfDescription)

      expect(resultFaulty).toEqual(expectedErrorSDResult)
    })
  })
})
