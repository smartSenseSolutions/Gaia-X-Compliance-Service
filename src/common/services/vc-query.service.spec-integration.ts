import { GenericContainer, StartedTestContainer } from 'testcontainers'
import { Test } from '@nestjs/testing'
import { AppModule } from '../../app.module'
import { VcQueryService } from './vc-query.service'
import neo4j from 'neo4j-driver'
import { TrustFramework2210ValidationService } from './tf2210/trust-framework-2210-validation.service'

jest.setTimeout(100000)

async function insertQuads(quads: string) {
  const _driver = neo4j.driver(process.env.dburl)
  const credentialUUID = TrustFramework2210ValidationService.getUUIDStartingWithALetter()
  const queries = VcQueryService.quadsToQueries(credentialUUID, quads)
  const session = _driver.session()
  for (const query of queries) {
    await session.executeWrite(tx => tx.run(query))
  }
  await session.close()
  return credentialUUID
}

describe('VCQueryService', () => {
  let memgraphContainer: StartedTestContainer, vcQueryService: VcQueryService

  beforeAll(async () => {
    memgraphContainer = await new GenericContainer('memgraph/memgraph:latest').withExposedPorts(7687).start()
    process.env.dburl = `bolt://${memgraphContainer.getHost()}:${memgraphContainer.getMappedPort(7687)}`
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      providers: [VcQueryService]
    }).compile()
    vcQueryService = moduleRef.get<VcQueryService>(VcQueryService)
  })

  afterAll(async () => {
    await memgraphContainer.stop()
  })

  it('should return LRN issuer when present', async () => {
    const credentialUUID = await insertQuads(lrnQuads)
    const lrnIssuer = await vcQueryService.searchForLRNIssuer(credentialUUID)
    expect(lrnIssuer).toEqual(['registration.lab.gaia-x.eu/development'])
  })

  it('should return all issuers of VCs from a VP', async () => {
    const credentialUUID = await insertQuads(fullVPQuads)
    const issuers = await vcQueryService.retrieveIssuers(credentialUUID)

    expect(issuers).toBeDefined()
    expect(issuers).toContain('registration.lab.gaia-x.eu/development')
    expect(issuers).toContain(
      'wizard.lab.gaia-x.eu:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc'
    )
  })
})

const lrnQuads = `<https://bakeup.io/lrn.json> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#legalRegistrationNumber> .
<https://bakeup.io/lrn.json> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> .
<https://bakeup.io/lrn.json> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#vatID> "FR79537407926" .
<https://bakeup.io/lrn.json> <https://www.w3.org/2018/credentials#credentialSubject> <https://bakeup.io/lrn.json> .
<https://bakeup.io/lrn.json> <https://www.w3.org/2018/credentials#issuer> <did:web:registration.lab.gaia-x.eu::development> .`

const fullVPQuads = `<https://bakeup.io/lrn.json> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#legalRegistrationNumber> _:b6 .
<https://bakeup.io/lrn.json> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> _:b6 .
<https://bakeup.io/lrn.json> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#vatID-countryCode> "FR" _:b6 .
<https://bakeup.io/lrn.json> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#vatID> "FR79537407926" _:b6 .
<https://bakeup.io/lrn.json> <https://w3id.org/security#proof> _:b7 _:b6 .
<https://bakeup.io/lrn.json> <https://www.w3.org/2018/credentials#credentialSubject> <https://bakeup.io/lrn.json> _:b6 .
<https://bakeup.io/lrn.json> <https://www.w3.org/2018/credentials#evidence> _:b9 _:b6 .
<https://bakeup.io/lrn.json> <https://www.w3.org/2018/credentials#issuanceDate> "2023-07-11T08:15:53.806Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> _:b6 .
<https://bakeup.io/lrn.json> <https://www.w3.org/2018/credentials#issuer> <did:web:registration.lab.gaia-x.eu::development> _:b6 .
<https://bakeup.io/tandcs.json> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#GaiaXTermsAndConditions> _:b10 .
<https://bakeup.io/tandcs.json> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#termsAndConditions> "The PARTICIPANT signing the Self-Description agrees as follows:\\n- to update its descriptions about any changes, be it technical, organizational, or legal - especially but not limited to contractual in regards to the indicated attributes present in the descriptions.\\n\\nThe keypair used to sign Verifiable Credentials will be revoked where Gaia-X Association becomes aware of any inaccurate statements in regards to the claims which result in a non-compliance with the Trust Framework and policy rules defined in the Policy Rules and Labelling Document (PRLD)." _:b10 .
<https://bakeup.io/tandcsvc.json> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> _:b10 .
<https://bakeup.io/tandcsvc.json> <https://w3id.org/security#proof> _:b11 _:b10 .
<https://bakeup.io/tandcsvc.json> <https://www.w3.org/2018/credentials#credentialSubject> <https://bakeup.io/tandcs.json> _:b10 .
<https://bakeup.io/tandcsvc.json> <https://www.w3.org/2018/credentials#issuanceDate> "2023-07-11T08:56:08.870Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> _:b10 .
<https://bakeup.io/tandcsvc.json> <https://www.w3.org/2018/credentials#issuer> <did:web:wizard.lab.gaia-x.eu:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc> _:b10 .
<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc#a07e753693fe6c52476c8bb1166b0062f98699c8da31cdb1e909bac4c8c90d1d> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#LegalParticipant> _:b1 .
<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc#a07e753693fe6c52476c8bb1166b0062f98699c8da31cdb1e909bac4c8c90d1d> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#headquarterAddress> _:b4 _:b1 .
<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc#a07e753693fe6c52476c8bb1166b0062f98699c8da31cdb1e909bac4c8c90d1d> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#legalAddress> _:b5 _:b1 .
<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc#a07e753693fe6c52476c8bb1166b0062f98699c8da31cdb1e909bac4c8c90d1d> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#legalName> "BAKEUP.IO" _:b1 .
<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc#a07e753693fe6c52476c8bb1166b0062f98699c8da31cdb1e909bac4c8c90d1d> <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#legalRegistrationNumber> <https://bakeup.io/lrn.json> _:b1 .
<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc?vcid=billowy-sandwich> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> _:b1 .
<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc?vcid=billowy-sandwich> <https://w3id.org/security#proof> _:b2 _:b1 .
<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc?vcid=billowy-sandwich> <https://www.w3.org/2018/credentials#credentialSubject> <https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc#a07e753693fe6c52476c8bb1166b0062f98699c8da31cdb1e909bac4c8c90d1d> _:b1 .
<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc?vcid=billowy-sandwich> <https://www.w3.org/2018/credentials#issuanceDate> "2023-07-11T08:05:52.512Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> _:b1 .
<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc?vcid=billowy-sandwich> <https://www.w3.org/2018/credentials#issuer> <did:web:wizard.lab.gaia-x.eu:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc> _:b1 .
_:b0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiablePresentation> .
_:b0 <https://www.w3.org/2018/credentials#verifiableCredential> _:b1 .
_:b0 <https://www.w3.org/2018/credentials#verifiableCredential> _:b10 .
_:b0 <https://www.w3.org/2018/credentials#verifiableCredential> _:b6 .
_:b12 <http://purl.org/dc/terms/created> "2023-07-11T08:56:09.833Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> _:b11 .
_:b12 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/security#JsonWebSignature2020> _:b11 .
_:b12 <https://w3id.org/security#jws> "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..go4WGZrNDGcIHdR28XKaDg_89rLmf0GFiapHtjLzgZRHyTK-79mbGDfOcL05hJUdwl33EtAxTUYg8AaAZne32yJEx6gs0ph5zl0CAChZOvzORN8bs8zmbVFPpWMdRWnSIlJdjdF44-7sIS7_lUlQhNWOZU8fxoE9Q4TJf0QqFxPjn1igkehoq6-PqnfgEsfk5QPmdrNauNgtKarJlKocOcH-xEhTi_pKruRwqc1dxyEbENzEVtCQYlMeT4EkcWlgltD9yFpOyTQKcBkfaGA8DZGEyy_VOBVjY6-6Y5nHo2WLfu027o1XWAlEsEGeDRnlft--flKvU3g6IMM_MyNt-A" _:b11 .
_:b12 <https://w3id.org/security#proofPurpose> <https://w3id.org/security#assertionMethod> _:b11 .
_:b12 <https://w3id.org/security#verificationMethod> <did:web:wizard.lab.gaia-x.eu:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc#JWK2020> _:b11 .
_:b3 <http://purl.org/dc/terms/created> "2023-07-11T08:05:54.045Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> _:b2 .
_:b3 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/security#JsonWebSignature2020> _:b2 .
_:b3 <https://w3id.org/security#jws> "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..CJj-eTX4QLqNga0_S5L6YV1pza98wdbC5Z6_zdQskf6ziFQUcU6RXA4mnvivSSQbfFtlrADB6sXcokSA8oAvUnueKh1-YEnFzE0xHADHeN8kiPGizIdRnsYcjgRlb4C5Dhm8bVu972kMgpFDZp1M8SV2C_evUzNuPLGc6cj-ohKkbh2D60JcepL_Gdb8gfD_maLXVb5F-NMGSJfnSED35VF6DyUMPMRnhGVL_IzhAtDE_TZy6JJAN3vJGaQOQgzr8sNg_sxqzg_8mW2s-dewwMElPZ7Y-uMbDdJkDjPGmoloLioMIT0XkpE_81s92hPcnuda56lh1nxzO1xlYMq6Hg" _:b2 .
_:b3 <https://w3id.org/security#proofPurpose> <https://w3id.org/security#assertionMethod> _:b2 .
_:b3 <https://w3id.org/security#verificationMethod> <did:web:wizard.lab.gaia-x.eu:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc#JWK2020> _:b2 .
_:b4 <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#countrySubdivisionCode> "FR-HDF" _:b1 .
_:b5 <https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#countrySubdivisionCode> "FR-HDF" _:b1 .
_:b8 <http://purl.org/dc/terms/created> "2023-07-11T08:15:55.038Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> _:b7 .
_:b8 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/security#JsonWebSignature2020> _:b7 .
_:b8 <https://w3id.org/security#jws> "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..ASlXi8NKl40KGSs7NaWg0PqfursR5LmdNVCRm8TTqfjcyEP9nZbrwvA8CV4u5FNXZq7g7ajOgl44h3Bp-8H2vJgxNDp8ex99x8WE8g0aT2BgKJAYye0EcyVGg95PGABB0bYMDF5dLhwl2WbjkYWK6rRzDOBgXgSe68IFvu_B5B-5CQAd1ArHYpuGLc_9NPzR5fN-42iv4vzb0qzpTmRNSLjj7GAHdqOFU43sF_nFP_v60JdGAA59cFthKg8XH89E4N8u_XGlKLAAXAGXg9QFVoLKw17Fxpp2guQrjER6l-19JMtCnXeLthdZSYwEtKOnSVEzshrdWf1ps-XrjawpgQ" _:b7 .
_:b8 <https://w3id.org/security#proofPurpose> <https://w3id.org/security#assertionMethod> _:b7 .
_:b8 <https://w3id.org/security#verificationMethod> <did:web:registration.lab.gaia-x.eu::development#X509-JWK2020> _:b7 .
_:b9 <gx:evidenceOf> "gx:vatID" _:b6 .
_:b9 <gx:evidenceURL> "http://ec.europa.eu/taxation_customs/vies/services/checkVatService" _:b6 .
_:b9 <gx:executionDate> "2023-07-11T08:15:53.805Z" _:b6 .
`
