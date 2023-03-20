import { Test, TestingModule } from '@nestjs/testing'
import { CommonModule } from '../../common/common.module'
import { ServiceOfferingContentValidationService } from './content-validation.service'
import { HttpModule } from '@nestjs/axios'
import { NotImplementedException } from '@nestjs/common'

describe('ParticipantContentValidationService', () => {
  let serviceOfferingContentValidationService: ServiceOfferingContentValidationService

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ServiceOfferingContentValidationService]
    }).compile()

    serviceOfferingContentValidationService = moduleRef.get<ServiceOfferingContentValidationService>(ServiceOfferingContentValidationService)
  })

  describe.skip(`Content validation`, () => {
    it('Validates a correct minimal Service Offering Self Description', async () => {
      throw new NotImplementedException()
    })
  })

  describe('CSR04_CheckHttp', () => {
    it('Should return valid result if all URLs are valid', async () => {
      const validUrls = ['https://abc-federation.gaia-x.community', 'https://compliance.lab.gaia-x.eu/development']

      const result = await serviceOfferingContentValidationService.CSR04_Checkhttp(validUrls)

      expect(result).toEqual({ conforms: true, results: [] })
    })

    it('Should return invalid result if there are invalid URLs', async () => {
      const invalidUrls = ['https://abc-federation.gaia-x.comm56468unity', 'https://abc-federation.gaia-x.community']
      const result = await serviceOfferingContentValidationService.CSR04_Checkhttp(invalidUrls)

      expect(result).toEqual({ conforms: false, results: ['https://abc-federation.gaia-x.comm56468unity'] })
    })
  })

  describe('checkDidUrls', () => {
    it('Should return empty array if all URLs are valid', async () => {
      const validUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:compliance.lab.gaia-x.eu::development']

      const result = await serviceOfferingContentValidationService.checkDidUrls(validUrls)

      expect(result).toEqual([])
    })

    it('Should return array of invalid URLs if there are invalid URLs', async () => {
      const invalidUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:abc-federation.gaia-x.c85ommunity']

      const result = await serviceOfferingContentValidationService.checkDidUrls(invalidUrls)

      expect(result).toEqual(['did:web:abc-federation.gaia-x.c85ommunity'])
    })
  })

  describe('CSR06_CheckDid', () => {
    it('Should return valid result if all URLs are valid', async () => {
      const validUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:compliance.lab.gaia-x.eu::development']

      const result = await serviceOfferingContentValidationService.CSR06_CheckDid(validUrls)

      expect(result).toEqual({ conforms: true, results: [] })
    })

    it('Should return invalid result if there are invalid URLs', async () => {
      const invalidUrls = ['did:web:abc-federation.gaia-x.comm56468unity', 'did:web:abc-federation.gaia-x.community']
      const result = await serviceOfferingContentValidationService.CSR06_CheckDid(invalidUrls)

      expect(result).toEqual({ conforms: false, results: ['did:web:abc-federation.gaia-x.comm56468unity'] })
    })
  })

  describe('compare function', () => {
    it('should return true if certchain2 includes certchain1', () => {
      const certchain1 = ['cert1', 'cert2']
      const certchain2 = ['cert2', 'cert3', 'cert1']
      expect(serviceOfferingContentValidationService.compare(certchain1, certchain2)).toBe(true)
    })

    it('should return false if certchain2 does not include certchain1', () => {
      const certchain1 = ['cert1', 'cert2']
      const certchain2 = ['cert3', 'cert4']
      expect(serviceOfferingContentValidationService.compare(certchain1, certchain2)).toBe(false)
    })
  })

  describe('checkDataExport function', () => {
    it('should return an object with conforms set to false and the appropriate error message if dataExport is missing', () => {
      const dataExport = null
      const expectedResult = { conforms: false, results: ['dataExport: types are missing.'] }
      expect(serviceOfferingContentValidationService.checkDataExport(dataExport)).toEqual(expectedResult)
    })

    it('should return an object with conforms set to false and the appropriate error message if requestType is not valid', () => {
      const dataExport = [{ 'gx-service-offering:requestType': 'invalid' }]
      const expectedResult = { conforms: false, results: [`requestType: invalid is not a valid requestType`] }
      expect(serviceOfferingContentValidationService.checkDataExport(dataExport)).toEqual(expectedResult)
    })

    it('should return an object with conforms set to false and the appropriate error message if accessType is not valid', () => {
      const dataExport = [{ 'gx-service-offering:accessType': 'invalid' }]
      const expectedResult = { conforms: false, results: [`accessType: invalid is not a valid accessType`] }
      expect(serviceOfferingContentValidationService.checkDataExport(dataExport)).toEqual(expectedResult)
    })

    it('should return an object with conforms set to false and the appropriate error message if formatType is not valid', () => {
      const dataExport = [{ 'gx-service-offering:formatType': 'invalid' }]
      const expectedResult = { conforms: false, results: [`formatType: invalid is not a valid formatType`] }
      expect(serviceOfferingContentValidationService.checkDataExport(dataExport)).toEqual(expectedResult)
    })
  })
})
