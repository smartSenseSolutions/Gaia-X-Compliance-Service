import { Test, TestingModule } from '@nestjs/testing'
import { CommonModule } from '../../common/common.module'
import { ServiceOfferingContentValidationService } from './service-offering-content-validation.service'
import { HttpModule } from '@nestjs/axios'
import { VcQueryService } from '../../common/services/vc-query.service'

describe('ServiceOfferingContentValidationService', () => {
  let serviceOfferingContentValidationService: ServiceOfferingContentValidationService

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ServiceOfferingContentValidationService, VcQueryService]
    }).compile()

    serviceOfferingContentValidationService = moduleRef.get<ServiceOfferingContentValidationService>(ServiceOfferingContentValidationService)
  })

  describe('Validations merge is correct', () => {
    it('should return true when all validations are true', () => {
      const result = serviceOfferingContentValidationService.mergeResults(
        {
          conforms: true,
          results: []
        },
        { conforms: true, results: [] }
      )
      expect(result.conforms).toBeTruthy()
      expect(result.results).toBeDefined()
      expect(result.results.length).toBe(0)
    })
    it('should return false when all validations are false', () => {
      const result = serviceOfferingContentValidationService.mergeResults(
        {
          conforms: false,
          results: ['a message']
        },
        { conforms: false, results: ['an another message'] }
      )
      expect(result.conforms).toBeFalsy()
      expect(result.results).toEqual(expect.arrayContaining(['a message', 'an another message']))
      expect(result.results.length).toBe(2)
    })
    it('should return false when a validation is false', () => {
      const result = serviceOfferingContentValidationService.mergeResults(
        {
          conforms: true,
          results: []
        },
        { conforms: false, results: ['an another message'] }
      )
      expect(result.conforms).toBeFalsy()
      expect(result.results).toEqual(expect.arrayContaining(['an another message']))
      expect(result.results.length).toBe(1)
    })
  })
})
