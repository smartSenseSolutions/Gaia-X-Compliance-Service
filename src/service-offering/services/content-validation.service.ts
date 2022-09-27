import { Injectable } from '@nestjs/common'
import { ServiceOfferingSelfDescriptionDto } from '../dto/service-offering-sd.dto'
import { ValidationResult, ValidationResultDto } from '../../common/dto/validation-result.dto'

@Injectable()
export class ServiceOfferingContentValidationService {
  async validate(data: ServiceOfferingSelfDescriptionDto, providedByResult?: ValidationResultDto): Promise<ValidationResult> {
    const results = []
    let conforms = true

    if (providedByResult !== undefined) {
      try {
        results.push({ [data.providedBy || 'providedBy']: providedByResult })
        conforms = providedByResult.conforms
      } catch {
        results.push({ [data.providedBy || 'providedBy']: `Could not load Participant SD at ${data.providedBy}` })
        conforms = false
      }
    }

    return { conforms, results }
  }
}
