import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { DocumentLoader } from '@gaia-x/json-web-signature-2020'
import Parser from '@rdfjs/parser-n3'
import jsonld from 'jsonld'
import rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import SHACLValidator from 'rdf-validate-shacl'
import { Readable } from 'stream'
import { Schema_caching, ValidationResult } from '../dto'
import { RegistryService } from './registry.service'

const cache: Schema_caching = {
  development: {}
}

@Injectable()
export class ShaclService {
  private readonly logger = new Logger(ShaclService.name)

  constructor(@Inject('documentLoader') private readonly documentLoader: DocumentLoader, private readonly registryService: RegistryService) {}

  async validate(shapes: DatasetExt, data: DatasetExt): Promise<ValidationResult> {
    const validator = new SHACLValidator(shapes, { factory: rdf as any })
    const report = await validator.validate(data)
    const { conforms, results: reportResults } = report

    const results: string[] = []
    for (const result of reportResults) {
      let errorMessage = `ERROR: ${result?.focusNode?.value} ${result.path}: ${result.message || 'does not conform with the given shape'}`

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
      const response = await this.registryService.getShape(type)
      return this.isJsonString(response) ? this.loadFromJSONLDWithQuads(response) : this.loadFromTurtle(response)
    } catch (error) {
      this.logger.error(`${error}, Url used to fetch shapes: ${process.env.REGISTRY_URL}/shapes/${type}`)
      throw new ConflictException(error)
    }
  }

  public async getShaclShape(shapeName: string): Promise<DatasetExt> {
    return await this.loadShaclFromUrl(shapeName)
  }

  public async verifyShape(verifiablePresentation: any, type: string): Promise<ValidationResult> {
    try {
      const selfDescriptionDataset: DatasetExt = await this.loadFromJSONLDWithQuads(verifiablePresentation)
      if (this.isCached(type)) {
        return await this.validate(cache[type].shape, selfDescriptionDataset)
      } else {
        const schema = await this.getShaclShape(type)
        cache[type].shape = schema
        return await this.validate(schema, selfDescriptionDataset)
      }
    } catch (e) {
      this.logger.error(e)
      return {
        conforms: false,
        results: [e.message]
      }
    }
  }

  async loadFromJSONLDWithQuads(data: object) {
    const quads = await jsonld.canonize(data, { format: 'application/n-quads', documentLoader: this.documentLoader })
    const parser = new Parser({ factory: rdf as any })
    if (!quads || quads.length === 0) {
      throw new ConflictException('Unable to canonize your VerifiablePresentation')
    }

    const stream = new Readable()
    stream.push(quads)
    stream.push(null)

    return await rdf.dataset().import(parser.import(stream))
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

  private isCached(type: string): boolean {
    return cache[type] && cache[type].shape
  }
}
