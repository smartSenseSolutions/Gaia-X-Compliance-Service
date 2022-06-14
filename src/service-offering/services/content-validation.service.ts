import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ValidationResult, ValidationResultDto } from '../../common/dto/validation-result.dto'
import { ServiceOfferingSelfDescriptionDto } from '../dto/service-offering-sd.dto'

@Injectable()
export class ServiceOfferingContentValidationService {
  constructor(private readonly httpService: HttpService) {}

  async validate(data: ServiceOfferingSelfDescriptionDto, providedByResult?: ValidationResultDto): Promise<ValidationResult> {
    const results = []
    let conforms: boolean

    try {
      results.push({ [data.providedBy || 'providedBy']: providedByResult })
      conforms = providedByResult.conforms
    } catch {
      results.push({ [data.providedBy || 'providedBy']: `Could not load Participant SD at ${data.providedBy}` })
      conforms = false
    }

    return { conforms, results }
  }
}
