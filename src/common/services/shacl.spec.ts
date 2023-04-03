import { Test, TestingModule } from '@nestjs/testing'
import { CommonModule } from '../common.module'
import { ShaclService } from './shacl.service'
import { DatasetCore } from 'rdf-js'
import { HttpModule } from '@nestjs/axios'
import { kyPromise } from '@digitalbazaar/http-client'
// Fixtures
import ParticipantSDFixture from '../../tests/fixtures/participant-sd.json'
import ParticipantMinimalSDFixture from '../../tests/fixtures/participant-sd.json'
import ParticipantFaultySDFixture from '../../tests/fixtures/participant-sd-faulty.json'

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
  const participantMinimalSDRaw = JSON.stringify(ParticipantMinimalSDFixture)
  const participantFaultySDRaw = JSON.stringify(ParticipantFaultySDFixture)

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ShaclService]
    }).compile()
    await kyPromise
    shaclService = moduleFixture.get<ShaclService>(ShaclService)
  })

  describe('SHACL dataset transformation of raw data', () => {
    it('transforms a dataset correctly from turtle input', async () => {
      const dataset = await shaclService.loadShaclFromUrl('participant')
      expectDatasetKeysToExist(dataset)
    })
    //TODO await https://github.com/digitalbazaar/jsonld.js/issues/516
    it.skip('transforms a dataset correctly from JsonLD input', async () => {
      const dataset = await shaclService.loadFromJSONLDWithQuads(JSON.parse(participantSDRaw))
      expectDatasetKeysToExist(dataset)
    })

    it('transforms a dataset correctly from an url with turtle input', async () => {
      const datasetParticipant = await shaclService.loadShaclFromUrl('participant')
      const datasetServiceOffering = await shaclService.loadShaclFromUrl('serviceoffering')

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
  //TODO await https://github.com/digitalbazaar/jsonld.js/issues/516
  describe('SHACL Shape Validation of a Self Descriptions', () => {
    it.skip('returns true for a Self Description using the correct shape', async () => {
      const sdDataset = await shaclService.loadFromJSONLDWithQuads(JSON.parse(participantSDRaw))

      const validationResult = await shaclService.validate(await getParticipantShaclShape(), sdDataset)

      expect(validationResult).toEqual(expectedValidResult)
    })
    //TODO await https://github.com/digitalbazaar/jsonld.js/issues/516
    it.skip('returns true for a minimal Self Description using the correct shape', async () => {
      const sdDatasetMinimal = await shaclService.loadFromJSONLDWithQuads(JSON.parse(participantMinimalSDRaw))
      const validationResult = await shaclService.validate(await getParticipantShaclShape(), sdDatasetMinimal)

      expect(validationResult).toEqual(expectedValidResult)
    })
    //TODO await https://github.com/digitalbazaar/jsonld.js/issues/516
    it.skip('returns false and errors for a Self Description not conforming to shape', async () => {
      const sdDatasetFaulty = await shaclService.loadFromJSONLDWithQuads(JSON.parse(participantFaultySDRaw))
      const validationResultFaulty = await shaclService.validate(await getParticipantShaclShape(), sdDatasetFaulty)

      expect(validationResultFaulty).toEqual(expectedErrorResult)
    })
  })

  async function getParticipantShaclShape() {
    return await shaclService.loadShaclFromUrl('participant')
  }

  function expectDatasetKeysToExist(dataset: any) {
    const keys = Object.keys(expectedDatasetObject)
    for (const key of keys) {
      expect(dataset[key]).toBeDefined()
    }
  }
})
