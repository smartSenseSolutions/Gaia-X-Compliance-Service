import { Injectable, Logger } from '@nestjs/common'
import neo4j from 'neo4j-driver'
import { graphValueFormat } from '../utils/graph-value-format'

@Injectable()
export class VcQueryService {
  private readonly _driver = neo4j.driver(process.env.dburl || 'bolt://localhost:7687')
  private readonly logger = new Logger(VcQueryService.name)

  async insertQuads(vpUUID: string, quads: any) {
    const queries = VcQueryService.quadsToQueries(vpUUID, quads)

    const session = this._driver.session()
    for (const query of queries) {
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
    const rdfEntries = quads
      .split('\n')
      .map(quad => VcQueryService.quadToRDFEntry(quad))
      .sort(this.compareRDFEntryFn)
    rdfEntries.forEach(rdfEntry => {
      this.insertInNodesIfNotExisting(nodes, rdfEntry.subject)
      // In case we have a node with the ID of this literal, we point to the existing node
      this.renameObjectIfMatchingAnExistingNode(nodes, rdfEntry)
      this.insertInNodesIfNotExisting(nodes, rdfEntry.object)

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
        CREATE (a)-[r:${this.prepareEdgeNameForGraph(edge.predicate)} {pType:"${this.prepareEdgeNameForGraph(edge.predicate)}"}]->(b);`
      })
    )
    return queries
  }

  static compareRDFEntryFn = (a, b) => {
    if (a.object?.startsWith('<') && !b.object?.startsWith('<')) {
      return -1
    } else if (b.object?.startsWith('<')) {
      return 1
    }
    return 0
  }

  static insertInNodesIfNotExisting(nodes: any[], nodeName) {
    if (nodes.indexOf(nodeName) < 0 && !!nodeName) {
      nodes.push(nodeName)
    }
  }

  /**
   * This allows JSON-LD to use string URI and not only {"@id"} structure
   * @param nodes the existing node list
   * @param rdfEntry an RDF entry composed of subject predicate object
   */
  private static renameObjectIfMatchingAnExistingNode = (nodes: any[], rdfEntry) => {
    if (!rdfEntry || !rdfEntry.object) {
      return
    }
    const renamedEntry = rdfEntry.object.replace(/"(.*)"/g, '<$1>')
    if (rdfEntry.object.startsWith('"') && nodes.indexOf(renamedEntry) > -1) {
      rdfEntry.object = renamedEntry
    }
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

  async hasDataResource(VPUUID: string) {
    const query = `MATCH 
    (credentialSubject)-[type:_http_www_w3_org_1999_02_22_rdf_syntax_ns_type_]-(credentialSubjectType)
    WHERE credentialSubjectType.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*"
    AND credentialSubjectType.value=~".*DataResource*."
    AND credentialSubject.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*"
    RETURN COUNT(*) as anyExisting`
    const session = this._driver.session()
    try {
      const results = await session.executeRead(tx => tx.run(query))
      await session.close()
      return results.records
        .flatMap(record => {
          return record.get('anyExisting')?.toNumber() > 0
        })
        .reduce((previousValue, currentValue) => previousValue && currentValue)
    } catch (Error) {
      this.logger.error(`Unable to verify if the VP contains a DataResource for VPUID ${VPUUID}`)
      return false
    }
  }

  async checkServiceOfferingIssuerMatchesProvidedByIssuer(VPUUID: string) {
    const query = `MATCH (serviceOfferingIssuer)-[p:_https_www_w3_org_2018_credentials_issuer_]-(o)-[cs:_https_www_w3_org_2018_credentials_credentialSubject_]-(serviceOffering)
-[type:_http_www_w3_org_1999_02_22_rdf_syntax_ns_type_]-(serviceOfferingType)
WHERE serviceOfferingIssuer.id=~"${VcQueryService.prepareNodeNameForGraph(
      VPUUID
    )}.*" AND serviceOffering.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*"
AND serviceOfferingType.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" AND serviceOfferingType.value=~".*ServiceOffering.*" 
CALL {
  WITH serviceOffering
  OPTIONAL MATCH (serviceOffering)-[r:_https_registry_lab_gaia_x_eu_development_api_trusted_shape_registry_v1_shapes_jsonld_trustframework_providedBy_]-(participant)
  -[partCS:_https_www_w3_org_2018_credentials_credentialSubject_]-(participantVC)-[partIssuer:_https_www_w3_org_2018_credentials_issuer_]-(participantIssuer)

  WHERE participant.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" 
  return DISTINCT participantIssuer
}
RETURN serviceOfferingIssuer,participantIssuer`
    const session = this._driver.session()
    try {
      const results = await session.executeRead(tx => tx.run(query))
      await session.close()
      return results.records
        .map(record => {
          return record.get('serviceOfferingIssuer')?.properties?.value === record.get('participantIssuer')?.properties?.value
        })
        .reduce((a, b) => a && b)
    } catch (Error) {
      this.logger.error(`Unable to retrieve DataResource's producedBy issuer for VPUID ${VPUUID}`)
      return false
    }
  }

  async checkDataResourceIssuerMatchesProducedByIssuer(VPUUID: string) {
    const query = `MATCH (dataResourceIssuer)-[p:_https_www_w3_org_2018_credentials_issuer_]-(o)-[cs:_https_www_w3_org_2018_credentials_credentialSubject_]-(dataSource)
-[type:_http_www_w3_org_1999_02_22_rdf_syntax_ns_type_]-(dataSourceType)
WHERE dataResourceIssuer.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" AND dataSource.id=~"${VcQueryService.prepareNodeNameForGraph(
      VPUUID
    )}.*"
AND dataSourceType.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" AND dataSourceType.value=~".*DataResource.*" 
CALL {
  WITH dataSource
  OPTIONAL MATCH (dataSource)-[r:_https_registry_lab_gaia_x_eu_development_api_trusted_shape_registry_v1_shapes_jsonld_trustframework_producedBy_]-(participant)
  -[partCS:_https_www_w3_org_2018_credentials_credentialSubject_]-(participantVC)-[partIssuer:_https_www_w3_org_2018_credentials_issuer_]-(participantIssuer)

  WHERE participant.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" 
  return DISTINCT participant,r,partCS,participantVC,partIssuer,participantIssuer
}
RETURN dataResourceIssuer,participantIssuer`
    const session = this._driver.session()
    try {
      const results = await session.executeRead(tx => tx.run(query))
      await session.close()
      return results.records
        .map(record => {
          return record.get('dataResourceIssuer')?.properties?.value === record.get('participantIssuer')?.properties?.value
        })
        .reduce((a, b) => a && b)
    } catch (Error) {
      this.logger.error(`Unable to retrieve DataResource's producedBy issuer for VPUID ${VPUUID}`)
      return false
    }
  }

  async retrieveAnIssuer(VPUUID: string, issuerCredentialType: string) {
    const query = `MATCH (issuer)-[r:_https_www_w3_org_2018_credentials_issuer_]-(node)
-[cs:_https_www_w3_org_2018_credentials_credentialSubject_]-(credentialSubject)
-[type:_http_www_w3_org_1999_02_22_rdf_syntax_ns_type_]-(credentialSubjectType)
WHERE issuer.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" AND credentialSubject.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*"
AND credentialSubjectType.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" AND credentialSubjectType.value=~".*${issuerCredentialType}.*"
RETURN DISTINCT issuer;`
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

  async hasLegitimateInterestIfContainsPIIOrHasNoPII(VPUUID: string) {
    const query = `OPTIONAL MATCH (resource)-[r:_https_registry_lab_gaia_x_eu_development_api_trusted_shape_registry_v1_shapes_jsonld_trustframework_containsPII_]-(pii)
    WHERE resource.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" 
    AND pii.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" 
    AND pii.value='"true"^^<http://www.w3.org/2001/XMLSchema#boolean>'
      CALL {
        OPTIONAL MATCH (legitimateInterest)-[type:_http_www_w3_org_1999_02_22_rdf_syntax_ns_type_]-(legitimateInterestType)
        WHERE legitimateInterest.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" 
        AND legitimateInterestType.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*"
        AND legitimateInterestType.value="<https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#LegitimateInterest>"
        RETURN legitimateInterest
      }
    RETURN pii,legitimateInterest`
    const session = this._driver.session()
    try {
      const results = await session.executeRead(tx => tx.run(query))
      await session.close()
      return results.records
        .flatMap(record => {
          return (!!record.get('pii') && !!record.get('legitimateInterest')) || !record.get('pii')
        })
        .reduce((previousValue, currentValue) => previousValue && currentValue)
    } catch (Error) {
      this.logger.error(`Unable to verify if the VP contains a DataResource for VPUID ${VPUUID}`)
      return false
    }
  }

  async cleanupVP(VPUUID: any) {
    try {
      const session = this._driver.session()
      await session.executeWrite(tx => tx.run(`MATCH (n) WHERE n.id=~"${VcQueryService.prepareNodeNameForGraph(VPUUID)}.*" DETACH DELETE n`))
      await session.close()
    } catch (e) {
      this.logger.warn(`An error occurred while removing VP ${VPUUID} from DB`, e)
    }
  }
}
