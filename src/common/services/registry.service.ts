import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'

@Injectable()
export class RegistryService {
  readonly registryUrl = process.env.REGISTRY_URL || 'https://registry.gaia-x.eu'

  constructor(private readonly httpService: HttpService) {}

  async isValidCertificateChain(raw: string): Promise<boolean> {
    const response = await this.httpService
      .post(`${this.registryUrl}/api/v2/trustAnchor/chain`, {
        certs: raw
      })
      .toPromise()

    return response.status === 200
  }
}
