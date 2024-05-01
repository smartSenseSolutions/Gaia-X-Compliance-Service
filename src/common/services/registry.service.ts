import { Inject, Injectable, Logger } from '@nestjs/common'
import { Got } from 'got'

@Injectable()
export class RegistryService {
  readonly registryUrl = process.env.REGISTRY_URL || 'https://registry.gaia-x.eu/development'
  private readonly logger = new Logger(RegistryService.name)

  constructor(@Inject('got') private readonly got: Got) {
    //Empty constructor
  }

  async isValidCertificateChain(raw: string): Promise<boolean> {
    try {
      // skip signature check against registry - NEVER ENABLE IN PRODUCTION
      if (process.env.DISABLE_SIGNATURE_CHECK === 'true') return true
      const response = await this.got.post(`${this.registryUrl}/api/trustAnchor/chain`, {
        json: {
          certs: raw
        }
      })

      return response.statusCode === 200
    } catch (error) {
      console.error(error)
      this.logger.error(error)
      return false
    }
  }

  async getImplementedTrustFrameworkShapes(): Promise<string[]> {
    return this.got.get(`${this.registryUrl}/shapes/implemented`).json()
  }

  async getShape(shape: string): Promise<any> {
    return this.got.get(`${this.registryUrl}/shapes/${shape}`).text()
  }

  async getBaseUrl(): Promise<string> {
    try {
      return this.got.get(`${this.registryUrl}/base-url`, { timeout: 600 }).json()
    } catch (HttpError) {
      console.error('unable to retrieve registry base url', HttpError.message)
      return process.env.REGISTRY_URL
    }
  }
}
