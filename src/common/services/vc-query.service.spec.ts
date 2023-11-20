import { VcQueryService } from './vc-query.service'

const sessionMock = {
  executeRead: tx => Promise.reject()
}

const driverMock = {
  session: () => sessionMock
}
jest.mock('neo4j-driver', () => {
  return {
    driver: (url: string) => driverMock
  }
})

describe('VcQueryService', () => {
  let vcQueryService: VcQueryService

  beforeEach(() => {
    vcQueryService = new VcQueryService()
  })

  describe('N-Quads to RDF entry mapping', () => {
    it('should manage different node/edge types', () => {
      const quads = [
        '_:b10 <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#response> "Confirm" .',
        '<https://lab.gaia-x.eu/cesDataResource.json> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#containsPII> "true"^^<http://www.w3.org/2001/XMLSchema#boolean> _:c14n6 .'
      ]

      let rdfEntry = VcQueryService.quadToRDFEntry(quads[0])
      expect(rdfEntry).toEqual({
        subject: '_:b10',
        predicate: '<https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#response>',
        object: 'Confirm'
      })

      rdfEntry = VcQueryService.quadToRDFEntry(quads[1])
      expect(rdfEntry).toEqual({
        subject: '<https://lab.gaia-x.eu/cesDataResource.json>',
        predicate: '<https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#containsPII>',
        object: 'true',
        graph: '_:c14n6'
      })
    })
  })

  describe('Service offering label level collection', () => {
    it('should manage Memgraph errors', async () => {
      await expect(vcQueryService.collectServiceOfferingLabelLevelDtos('test')).resolves.toEqual([])
    })
  })
})
