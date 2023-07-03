import { Injectable } from '@nestjs/common'
import neo4j, { Record } from 'neo4j-driver'

@Injectable()
export class VcQueryService {
  private readonly _driver = neo4j.driver(process.env.dburl || 'bolt://localhost:7687')

  async insertQuads(vpUUID: string, quads: any) {
    const session = this._driver.session()

    for (const query of this.quadsToQueries(vpUUID, quads)) {
      try {
        await session.executeWrite(tx => tx.run(query))
      } catch (Error) {
        console.log(query)
        console.log(Error)
      }
    }
    await session.close()
  }

  quadsToQueries(vpUUID: string, quads) {
    const edges = []
    const nodes = []
    quads.split('\n').forEach(quad => {
      const rdfEntry = this.quadToRDFEntry(quad)
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

  quadToRDFEntry(quad: string) {
    const splittedQuad = quad.split(' ')
    return {
      subject: splittedQuad[0],
      predicate: splittedQuad[1],
      object: splittedQuad[2],
      graph: splittedQuad[3]
    }
  }

  prepareNodeNameForGraph(name: string): string {
    if (!name || name === '') {
      return ''
    } else if ('.' === name) {
      return 'root'
    } else if (name === '""') {
      return '_empty_'
    }
    return this.sanitizeNames(name)
  }

  prepareEdgeNameForGraph(name: string): string {
    if (!name) {
      return 'childOf'
    }
    return this.sanitizeNames(name)
  }

  private sanitizeNames(name: string) {
    return name.replace(/[\W_]+/g, '_')
  }

  async searchForLRNIssuer(VPUUID: any) {
    const session = this._driver.session()
    try {
      const query = `MATCH (issuer)-[r:_https_www_w3_org_2018_credentials_issuer_]-(issued)
-[cs:_https_www_w3_org_2018_credentials_credentialSubject_]-(credentialSubject)
-[type:_http_www_w3_org_1999_02_22_rdf_syntax_ns_type_]-(credentialSubjectType)
WHERE issued.id=~"${this.prepareNodeNameForGraph(VPUUID)}.*" 
AND issuer.id=~"${this.prepareNodeNameForGraph(VPUUID)}.*" 
AND credentialSubjectType.id=~"${this.prepareNodeNameForGraph(VPUUID)}.*" 
AND credentialSubject.id=~"${this.prepareNodeNameForGraph(VPUUID)}.*"
RETURN issuer,credentialSubjectType`
      const results = await session.executeRead(tx => tx.run(query))
      await session.close()
      const lrn: Record = this.findLegalRegistrationNumberRecord(results.records)
      return this.getLegalRegistrationNumberIssuer(lrn)
    } catch (Error) {
      console.error(`Unable to retrieve the legalRegistrationNumber for VPUID ${VPUUID}`)
      console.error(Error)
      return undefined
    }
  }

  findLegalRegistrationNumberRecord(records: Array<Record<any>>) {
    const filter = records.filter(record => {
      const credentialType = record.get('credentialSubjectType')
      return credentialType?.labels?.filter(label => label.indexOf('gx_legalRegistrationNumber_') > -1).length > 0
    })
    return filter.length > 0 ? filter[0] : undefined
  }

  getLegalRegistrationNumberIssuer(lrnRecord: Record) {
    if (!lrnRecord) {
      return undefined
    }
    return lrnRecord.get('issuer')?.properties?.value
  }
}
