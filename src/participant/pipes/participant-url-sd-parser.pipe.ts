import { HttpService } from '@nestjs/axios'
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { SignedParticipantSelfDescriptionDto } from '../dto/participant-sd.dto'
import { VerifyParticipantDto } from '../dto/verify-participant.dto'
import { ParticipantSDParserPipe } from './participant-sd-parser.pipe'
@Injectable()
export class ParticipantUrlSDParserPipe implements PipeTransform<VerifyParticipantDto, Promise<SignedParticipantSelfDescriptionDto>> {
  constructor(private readonly httpService: HttpService) {}

  participantSDParserPipe = new ParticipantSDParserPipe()

  async transform(participant: VerifyParticipantDto): Promise<SignedParticipantSelfDescriptionDto> {
    const { url } = participant
    if (!url) throw new BadRequestException('url is required')

    const response = await this.httpService.get(url, { transformResponse: r => r }).toPromise()
    const { data: rawData } = response
    let data = {}
    try {
      data = JSON.parse(rawData)
    } catch {
      throw new BadRequestException('URL is expected to reference data in JSON LD format')
    }

    return this.participantSDParserPipe.transform(data as any)
  }
}
