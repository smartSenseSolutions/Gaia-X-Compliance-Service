import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import ParserJsonLD from '@rdfjs/parser-jsonld'
import Parser from '@rdfjs/parser-n3'
import rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import SHACLValidator from 'rdf-validate-shacl'
import { Readable } from 'stream'
import { ValidationResult } from '../dto/validation-result.dto'

@Injectable()
export class ShaclService {
  constructor(private readonly httpService: HttpService) {}

  async validate(shapes: DatasetExt, data: DatasetExt): Promise<ValidationResult> {
    const validator = new SHACLValidator(shapes, { factory: rdf as any })
    const { conforms, results: reportResults } = validator.validate(data)

    const results = reportResults.map(result => {
      const message = result.message.join(', ') || 'does not conform with the given shape'
      return `${result.path}: ${message}`
    })

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
      console.error(error)
    }
  }

  async loadFromJsonLD(raw: string): Promise<DatasetExt> {
    try {
      const parser = new ParserJsonLD({ factory: rdf })
      return this.transformToStream(raw, parser)
    } catch (error) {
      console.error(error)
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

  async loadFromUrl(url: string): Promise<DatasetExt> {
    try {
      const response = await this.httpService
        .get(url, {
          // avoid JSON parsing and get plain json string as data
          transformResponse: r => r
        })
        .toPromise()

      return this.isJsonString(response.data) ? this.loadFromJsonLD(response.data) : this.loadFromTurtle(response.data)
    } catch (error) {
      console.error(error)
    }
  }
}
