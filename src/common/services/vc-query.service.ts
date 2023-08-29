import { Injectable, Logger } from '@nestjs/common'
import neo4j from 'neo4j-driver'
import { graphValueFormat } from '../utils/graph-value-format'

@Injectable()
export class VcQueryService {
  private readonly _driver = neo4j.driver(process.env.dburl || 'bolt://localhost:7687')
  private readonly logger = new Logger(VcQueryService.name)

  async insertQuads(vpUUID: string, quads: any) {
    const session = this._driver.session()
    
    for (const query of VcQueryService.quadsToQueries(vpUUID, quads)) {
      try {
        await session.executeWrite(tx => tx.run(query))
      } catch (Error) {
        this.logger.log(query)
        this.logger.log(Error)
      }
    }
    await session.close()
  }

  static quadsToQueries(vpUUID: string, quads) {
    const edges = []
    const nodes = []
    quads.split('\n').forEach(quad => {
      const rdfEntry = VcQueryService.quadToRDFEntry(quad)
      if (nodes.indexOf(rdfEntry.subject) < 0 && !!rdfEntry.subject) {
        nodes.push(rdfEntry.subject)
      }
      if (nodes.indexOf(rdfEntry.object) < 0 && !!rdfEntry.object) {
        nodes.push(rdfEntry.object)
      }
      edges.push({ from: rdfEntry.subject, to: rdfEntry.object, predicate: rdfEntry.predicate })
    })
    const queries = []
    queries.push(
      ...nodes.map(node => {
        const nodeName = this.prepareNodeNameForGraph(vpUUID + node)
        return `CREATE (${nodeName}:${this.prepareNodeNameForGraph(node)} {id:'${nodeName}', value:'${node}', vpID:'${vpUUID}'});\n`
      })
    )
    queries.push(
      ...edges.map(edge => {
        return `MATCH (a),(b)
        WHERE a.id='${this.prepareNodeNameForGraph(vpUUID + edge.from)}' AND b.id='${this.prepareNodeNameForGraph(vpUUID + edge.to)}'
        CREATE (a)-[r:${this.prepareEdgeNameForGraph(edge.predicate)}]->(b);`
      })
    )
    return queries
  }

  static quadToRDFEntry(quad: string) {
    const splittedQuad = quad.split(' ')
    return {
      subject: splittedQuad[0],
      predicate: splittedQuad[1],
      object: splittedQuad[2],
      graph: splittedQuad[3]
    }
  }

  static prepareNodeNameForGraph(name: string): string {
    if (!name || name === '') {
      return ''
    } else if ('.' === name) {
      return 'root'
    } else if (name === '""') {
      return '_empty_'
    }
    return VcQueryService.sanitizeNames(name)
  }

  static prepareEdgeNameForGraph(name: string): string {
    if (!name) {
      return 'childOf'
    }
    return VcQueryService.sanitizeNames(name)
  }

  static sanitizeNames(name: string) {
    return name.replace(/[\W_]+/g, '_')
  }

  async searchForLRNIssuer(VPUUID: any) {
    return this.retrieveAnIssuer(VPUUID, 'legalRegistrationNumber')
  }

  async retrieveIssuers(VPUUID: string): Promise<string[]> {
    const session = this._driver.session()
    try {
      const query = `MATCH (node)-[r:_https_www_w3_org_2018_credentials_issuer_]->(issuer)
WHERE issuer.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" 
RETURN DISTINCT issuer`
      const results = await session.executeRead(tx => tx.run(query))
      await session.close()
      return results.records.map(record => {
        return graphValueFormat(record.get('issuer')?.properties?.value)
      })
    } catch (Error) {
      this.logger.error(`Unable to retrieve the issuers for VPUID ${VPUUID}`)
      this.logger.error(Error)
      return []
    }
  }

  async retrieveTermsAndConditionsIssuers(VPUUID: string) {
    return this.retrieveAnIssuer(VPUUID, 'GaiaXTermsAndConditions')
  }

  async retrieveAnIssuer(VPUUID: string, issuerCredentialType: string) {
    const query = `MATCH (issuer)-[r:_https_www_w3_org_2018_credentials_issuer_]-(node)
-[cs:_https_www_w3_org_2018_credentials_credentialSubject_]-(credentialSubject)
-[type:_http_www_w3_org_1999_02_22_rdf_syntax_ns_type_]-(credentialSubjectType)
WHERE issuer.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" AND credentialSubject.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*"
AND credentialSubjectType.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" AND credentialSubjectType.value=~".*${issuerCredentialType}.*"
RETURN issuer;`
    const session = this._driver.session()
    try {
      const results = await session.executeRead(tx => tx.run(query))
      await session.close()
      return results.records.map(record => {
        return graphValueFormat(record.get('issuer')?.properties?.value)
      })
    } catch (Error) {
      this.logger.error(`Unable to retrieve ${issuerCredentialType} for VPUID ${VPUUID}`)
      return []
    }
  }
}
