import { ConflictException, Injectable } from '@nestjs/common'
import { mergeResults, VerifiablePresentation } from '../verifiable-presentation-validation.service'
import { ValidationResult, VerifiableCredentialDto } from '../../dto'
import { ParticipantContentValidationService } from '../../../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from '../../../service-offering/services/content-validation.service'
import { ParticipantSelfDescriptionDto } from '../../../participant/dto'
import { ServiceOfferingSelfDescriptionDto } from '../../../service-offering/dto'

export function getAtomicType(vc: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>): string {
  if (vc.type && Array.isArray(vc.type)) {
    return getAtomicTypeFromArray(vc.type)
  } else if (vc.type && vc.type !== 'VerifiableCredential') {
    return getAtomicTypeFromString(<string>vc.type)
  } else if (vc.credentialSubject.type && Array.isArray(vc.credentialSubject.type)) {
    return getAtomicTypeFromArray(vc.credentialSubject.type)
  } else if (vc.credentialSubject.type) {
    return getAtomicTypeFromString(<string>vc.credentialSubject.type)
  }
}

function getAtomicTypeFromArray(types: string[]) {
  const baseType = types.find(t => t !== 'VerifiableCredential')[0]
  return getAtomicTypeFromString(baseType)
}

function getAtomicTypeFromString(type: string) {
  return type.substring(type.lastIndexOf(':') + 1)
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
      const atomicType = getAtomicType(vc)
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
