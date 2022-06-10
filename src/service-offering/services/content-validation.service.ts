import { BadRequestException, Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ValidationResult, ValidationResultDto } from '../../common/dto/validation-result.dto'
import { ServiceOfferingSelfDescriptionDto } from '../dto/service-offering-sd.dto'
import { ParticipantService } from '../../participant/services/participant.service'
import { ParticipantSDParserPipe } from '../../participant/pipes/participant-sd-parser.pipe'

@Injectable()
export class ServiceOfferingContentValidationService {
  constructor(private readonly httpService: HttpService, private readonly participantService: ParticipantService) {}

  async validate(data: ServiceOfferingSelfDescriptionDto): Promise<ValidationResult> {
    const results = []
    let conforms: boolean
    let providedByResult: ValidationResultDto

    try {
      providedByResult = await this.validateProvidedByParticipantSelfDescriptions(data.providedBy)
      results.push({ [data.providedBy || 'providedBy']: providedByResult })
      conforms = providedByResult.conforms
    } catch {
      results.push({ [data.providedBy || 'providedBy']: `Could not load Participant SD at ${data.providedBy}` })
      conforms = false
    }

    return { conforms, results }
  }

  async validateProvidedByParticipantSelfDescriptions(providedBy: ServiceOfferingSelfDescriptionDto['providedBy']): Promise<ValidationResultDto> {
    const response = await this.httpService.get(providedBy).toPromise()
    const { data } = response

    const participantSD = new ParticipantSDParserPipe().transform(data)

    return await this.participantService.validate(participantSD)
  }
}
