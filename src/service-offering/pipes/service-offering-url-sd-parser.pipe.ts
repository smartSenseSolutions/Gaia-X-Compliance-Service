import { HttpService } from '@nestjs/axios'
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { SignedServiceOfferingSelfDescriptionDto } from '../dto/service-offering-sd.dto'
import { VerifyServiceOfferingDto } from '../dto/verify-service-offering.dto'
import { ServiceOfferingSDParserPipe } from './service-offering-sd-parser.pipe'
@Injectable()
export class ParticipantUrlSDParserPipe implements PipeTransform<VerifyServiceOfferingDto, Promise<SignedServiceOfferingSelfDescriptionDto>> {
  constructor(private readonly httpService: HttpService) {}

  serviceOfferingSDParserPipe = new ServiceOfferingSDParserPipe()

  async transform(participant: VerifyServiceOfferingDto): Promise<SignedServiceOfferingSelfDescriptionDto> {
    const { url } = participant
    if (!url) throw new BadRequestException('url is required')

    try {
      const response = await this.httpService.get(url, { transformResponse: r => r }).toPromise()
      const { data: rawData } = response
      let data = {}
      data = JSON.parse(rawData)
      return this.serviceOfferingSDParserPipe.transform(data as any)
    } catch {
      throw new BadRequestException('URL is expected to reference data in JSON LD format')
    }
  }
}
