import { HttpService } from '@nestjs/axios'
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { SDParserPipe } from '../../common/pipes/sd-parser.pipe'
import { SignedSelfDescriptionDto } from '../../common/dto/self-description.dto'
import { VerifiableSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import { VerifyParticipantDto } from '../../participant/dto/verify-participant.dto'
import { VerifySdDto } from '../../common/dto/self-description.dto'
@Injectable()
export class UrlSDParserPipe implements PipeTransform<VerifyParticipantDto, Promise<SignedSelfDescriptionDto>> {
  constructor(private readonly sdType: 'LegalPerson' | 'ServiceOfferingExperimental', private readonly httpService: HttpService) {}

  private readonly sdParser = new SDParserPipe(this.sdType)

  async transform(participant: VerifySdDto): Promise<SignedSelfDescriptionDto> {
    const { url } = participant

    try {
      const response = await this.httpService.get(url, { transformResponse: r => r }).toPromise()
      const { data: rawData } = response
      const data: VerifiableSelfDescriptionDto = JSON.parse(rawData)
      return this.sdParser.transform(data as any)
    } catch {
      throw new BadRequestException('URL is expected to reference data in JSON LD format')
    }
  }
}
