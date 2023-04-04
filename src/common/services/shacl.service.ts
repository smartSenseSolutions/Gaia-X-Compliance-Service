import { HttpService } from '@nestjs/axios'
import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Readable } from 'stream'
import DatasetExt from 'rdf-ext/lib/Dataset'
import Parser from '@rdfjs/parser-n3'
import rdf from 'rdf-ext'
import SHACLValidator from 'rdf-validate-shacl'
import { SelfDescriptionTypes } from '../enums'
import { Schema_caching, ValidationResult } from '../dto'
import jsonld from 'jsonld'

const cache: Schema_caching = {
  LegalParticipant: {},
  legalRegistrationNumber: {},
  ServiceOfferingExperimental: {}
}

@Injectable()
export class ShaclService {
  constructor(private readonly httpService: HttpService) {}

  private readonly logger = new Logger(ShaclService.name)
  static readonly SHAPE_PATHS = {
    PARTICIPANT: 'participant',
    LEGAL_REGISTRATION_NUMBER: 'participant',
    SERVICE_OFFERING: 'serviceoffering'
  }

  async validate(shapes: DatasetExt, data: DatasetExt): Promise<ValidationResult> {
    const validator = new SHACLValidator(shapes, { factory: rdf as any })
    const report = await validator.validate(data)
    const { conforms, results: reportResults } = report

    const results: string[] = []
    for (const result of reportResults) {
      let errorMessage = `ERROR: ${result.path}: ${result.message || 'does not conform with the given shape'}`

      if (result.detail && result.detail.length > 0) {
        errorMessage = `${errorMessage}; DETAILS:`
        for (const detail of result.detail) {
          errorMessage = `${errorMessage} ${detail.path}: ${detail.message || 'does not conform with the given shape'};`
        }
      }
      results.push(errorMessage)
    }

    return {
      conforms,
      results
    }
  }

  async loadFromTurtle(raw: string): Promise<DatasetExt> {
    try {
      const parser = new Parser({ factory: rdf as any })
      return this.transformToStream(raw, parser)
    } catch (error) {
      throw new ConflictException('Cannot load from provided turtle.')
    }
  }

  async loadShaclFromUrl(type: string): Promise<DatasetExt> {
    try {
      const url = process.env.REGISTRY_URL || 'https://registry.lab.gaia-x.eu/development'
      const response = (await this.httpService.get(`${url}/api/trusted-shape-registry/v1/shapes/${type}`).toPromise()).data
      return this.isJsonString(response) ? this.loadFromJSONLDWithQuads(response) : this.loadFromTurtle(response)
    } catch (error) {
      this.logger.error(`${error}, Url used to fetch shapes: ${process.env.REGISTRY_URL}/api/trusted-shape-registry/v1/shapes/${type}`)
      throw new ConflictException(error)
    }
  }

  private async transformToStream(raw: string, parser: any): Promise<DatasetExt> {
    const stream = new Readable()
    stream.push(raw)
    stream.push(null)

    return await rdf.dataset().import(parser.import(stream))
  }

  private isJsonString(str: any): boolean {
    try {
      JSON.parse(str)
    } catch (e) {
      return false
    }

    return true
  }

  public async getShaclShape(link: string): Promise<DatasetExt> {
    return await this.loadShaclFromUrl(link)
  }

  public async verifyShape(rawCredentialSubject: string, type: string): Promise<ValidationResult> {
    try {
      const rawPrepared = {
        ...JSON.parse(rawCredentialSubject)
      }
      const selfDescriptionDataset: DatasetExt = await this.loadFromJSONLDWithQuads(rawPrepared)
      if (this.isCached(type)) {
        return await this.validate(cache[type].shape, selfDescriptionDataset)
      } else {
        try {
          const shapePath = this.getShapePath(type)
          if (!shapePath) {
            return { conforms: true, results: [] }
          }
          const schema = await this.getShaclShape(shapePath)
          cache[type].shape = schema
          return await this.validate(schema, selfDescriptionDataset)
        } catch (e) {
          console.log(e)
          return {
            conforms: false,
            results: [e]
          }
        }
      }
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  private isCached(type: string): boolean {
    let cached = false
    if (cache[type] && cache[type].shape) {
      cached = true
    }
    return cached
  }

  private getShapePath(type: string): string | undefined {
    const shapePathType = {
      [SelfDescriptionTypes.PARTICIPANT]: 'PARTICIPANT',
      [SelfDescriptionTypes.LEGAL_REGISTRATION_NUMBER]: 'LEGAL_REGISTRATION_NUMBER',
      [SelfDescriptionTypes.SERVICE_OFFERING]: 'SERVICE_OFFERING'
    }

    return ShaclService.SHAPE_PATHS[shapePathType[type]] || undefined
  }

  async loadFromJSONLDWithQuads(data: object) {
    let quads
    try {
      quads = await jsonld.toRDF(data, { format: 'application/n-quads' })
    } catch (Error) {
      console.error('Unable to parse from JSONLD', Error)
    }
    const parser = new Parser({ factory: rdf as any })

    const stream = new Readable()
    stream.push(quads)
    stream.push(null)

    return await rdf.dataset().import(parser.import(stream))
  }
}
