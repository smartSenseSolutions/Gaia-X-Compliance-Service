import { ConflictException, Injectable } from '@nestjs/common'
import { mergeResults, VerifiablePresentation } from '../verifiable-presentation-validation.service'
import { ValidationResult } from '../../dto'
import { ParticipantContentValidationService } from '../../../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from '../../../service-offering/services/content-validation.service'
import { ParticipantSelfDescriptionDto } from '../../../participant/dto'

export function getAtomicType(type: string[]): string {
  const baseType = type.filter(t => t !== 'VerifiableCredential')[0]
  return baseType.substring(baseType.lastIndexOf(':') + 1)
}

@Injectable()
export class TrustFramework2210ValidationService {
  constructor(
    private participantValidationService: ParticipantContentValidationService,
    private serviceOfferingValidationService: ServiceOfferingContentValidationService
  ) {
    //Empty constructor
  }

  async validate(vp: VerifiablePresentation): Promise<ValidationResult> {
    const validationResults: ValidationResult[] = []
    for (const vc of vp.verifiableCredential) {
      const atomicType = getAtomicType(vc.type)
      if (atomicType === 'LegalParticipant') {
        validationResults.push(await this.participantValidationService.validate(<ParticipantSelfDescriptionDto>(<unknown>vc.credentialSubject)))
      } else if (atomicType === 'ServiceOffering') {
        throw new ConflictException('ServiceOffering validation for TF2210 not implemented yet')
        //validationResults.push(await this.serviceOfferingValidationService.validate(<any>vc, null, null))
      }
      //TODO validationRegistrationNumber
    }
    return mergeResults(...validationResults)
  }
}
