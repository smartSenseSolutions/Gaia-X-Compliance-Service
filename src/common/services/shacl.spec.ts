import { HttpModule } from '@nestjs/axios'
import { Test, TestingModule } from '@nestjs/testing'
import { DatasetCore } from 'rdf-js'
import ParticipantFaultySDFixture from '../../tests/fixtures/participant-vp-faulty.json'
// Fixtures
import ParticipantSDFixture from '../../tests/fixtures/participant-vp.json'
import ServiceOfferingMissingProvideByFixture from '../../tests/fixtures/service-offering-vp-providedBy-absent.json'
import ServiceOfferingBadStructureFixture from '../../tests/fixtures/service-offering-vp-structure-invalid.json'
import ServiceOfferingFixture from '../../tests/fixtures/service-offering-vp.json'
import mockDocumentLoader from '../../utils/static-document-loader'
import { CommonModule } from '../common.module'
import { ShaclService } from './shacl.service'

export const expectedErrorResult = expect.objectContaining({
  conforms: false,
  results: expect.arrayContaining([expect.any(String)])
})

export const expectedValidResult = expect.objectContaining({
  conforms: true
})

describe('ShaclService', () => {
  let shaclService: ShaclService

  const expectedDatasetObject: DatasetCore = {
    size: expect.any(Number),
    has: expect.any(Function),
    delete: expect.any(Function),
    add: expect.any(Function),
    match: expect.any(Function),
    [Symbol.iterator]: expect.any(Object)
  }

  const participantSDRaw = JSON.stringify(ParticipantSDFixture)
  const participantFaultySDRaw = JSON.stringify(ParticipantFaultySDFixture)

  beforeAll(async () => {
    mockDocumentLoader(null)

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ShaclService]
    }).compile()
    shaclService = moduleFixture.get<ShaclService>(ShaclService)
  })

  describe('SHACL dataset transformation of raw data', () => {
    it('transforms a dataset correctly from turtle input', async () => {
      const dataset = await shaclService.loadShaclFromUrl('trustframework')
      expectDatasetKeysToExist(dataset)
    })
    it('transforms a dataset correctly from JsonLD input', async () => {
      const dataset = await shaclService.loadFromJSONLDWithQuads(JSON.parse(participantSDRaw))
      expectDatasetKeysToExist(dataset)
    })

    it('transforms a dataset correctly from an url with turtle input', async () => {
      const datasetParticipant = await shaclService.loadShaclFromUrl('trustframework')
      const datasetServiceOffering = await shaclService.loadShaclFromUrl('trustframework')

      expectDatasetKeysToExist(datasetParticipant)
      expectDatasetKeysToExist(datasetServiceOffering)
    })
    it('should throw an error when searching for a non uploaded shape', async () => {
      try {
        await shaclService.loadShaclFromUrl('test')
        fail()
      } catch (e) {
        expect(e.status).toEqual(409)
      }
    })
  })
  describe('SHACL Shape Validation of a Self Descriptions', () => {
    it('returns true for a Self Description using the correct shape', async () => {
      const sdDataset = await shaclService.loadFromJSONLDWithQuads(JSON.parse(participantSDRaw))

      const validationResult = await shaclService.validate(await getShaclShape(), sdDataset)

      expect(validationResult).toEqual(expectedValidResult)
    })
    it('returns false and errors for a Self Description not conforming to shape', async () => {
      const sdDatasetFaulty = await shaclService.loadFromJSONLDWithQuads(JSON.parse(participantFaultySDRaw))
      const validationResultFaulty = await shaclService.validate(await getShaclShape(), sdDatasetFaulty)

      expect(validationResultFaulty).toEqual(expectedErrorResult)
    })
  })

  describe('SHACL Shape Validation of a ServiceOffering', () => {
    it('returns true for a Serviceoffering using the correct shape', async () => {
      const serviceOffering = await shaclService.loadFromJSONLDWithQuads(ServiceOfferingFixture)
      const validationResult = await shaclService.validate(await getShaclShape(), serviceOffering)

      expect(validationResult).toEqual(expectedValidResult)
    })
    it('returns false ServiceOffering without proper providedBy', async () => {
      const serviceOffering = await shaclService.loadFromJSONLDWithQuads(ServiceOfferingMissingProvideByFixture)
      const validationResult = await shaclService.validate(await getShaclShape(), serviceOffering)

      expect(validationResult).toEqual(expectedErrorResult)
    })
    it('returns false ServiceOffering without correct shape', async () => {
      const serviceOffering = await shaclService.loadFromJSONLDWithQuads(ServiceOfferingBadStructureFixture)
      const validationResultFaulty = await shaclService.validate(await getShaclShape(), serviceOffering)

      expect(validationResultFaulty).toEqual(expectedErrorResult)
    })
  })

  async function getShaclShape() {
    return await shaclService.loadShaclFromUrl('trustframework')
  }

  function expectDatasetKeysToExist(dataset: any) {
    const keys = Object.keys(expectedDatasetObject)
    for (const key of keys) {
      expect(dataset[key]).toBeDefined()
    }
  }
})
