import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'

export const DID_WEB_PATTERN = /^(did:web:)([a-zA-Z0-9%._-]*:)*[a-zA-Z0-9%._-]+$/

@Injectable()
export class RegistryService {
  constructor(private readonly httpService: HttpService) { }

  async isValidCertificateChain(raw: string): Promise<boolean> {
    const response = await this.httpService
      .post('https://registry.gaia-x.eu/api/trustAnchor/chain', {
        certs: raw
      })
      .toPromise()

    return response.status === 200
  }
}
