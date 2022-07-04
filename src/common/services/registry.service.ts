import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'

@Injectable()
export class RegistryService {
  constructor(private readonly httpService: HttpService) {}

  async isValidCertificateChain(raw: string): Promise<boolean> {
    const response = await this.httpService
      .post('https://registry.lab.gaia-x.eu/api/trustAnchor/chain', {
        certs: raw
      })
      .toPromise()

    return response.status === 200
  }
}
