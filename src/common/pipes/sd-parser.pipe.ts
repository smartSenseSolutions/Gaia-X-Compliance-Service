import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { hasExpectedValues } from '../../common/utils'
import { ParticipantSelfDescriptionDto, VerifiableSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import { SignedSelfDescriptionDto } from '../dto/self-description.dto'
// import { VerifyParticipantRawDto } from '../dto/verify-participant-raw.dto'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto/service-offering-sd.dto'

@Injectable()
export class SDParserPipe implements PipeTransform<VerifiableSelfDescriptionDto, SignedSelfDescriptionDto> {
  private readonly addressFields = ['legalAddress', 'headquarterAddress']

  private readonly SD_TYPES = {
    PARTICIPANT: 'gx-participant:LegalPerson',
    SERVICE_OFFERING: 'gx-service-offering-experimental:ServiceOfferingExperimental'
  }
  private readonly expected_participant = {
    '@context': {
      'gx-participant': 'http://w3id.org/gaia-x/participant#'
    },
    '@type': 'gx-participant:LegalPerson'
  }

  private readonly expected_service_offering = {
    '@context': {
      'gx-participant': 'http://w3id.org/gaia-x/participant#',
      'gx-resource': 'http://w3id.org/gaia-x/resource#',
      'gx-service-offering': 'http://w3id.org/gaia-x/service-offering#'
    },
    '@type': 'gx-service-offering-experimental:ServiceOfferingExperimental'
  }

  transform(verifiableSelfDescriptionDto: VerifiableSelfDescriptionDto): SignedSelfDescriptionDto {
    try {
      const { complianceCredential, selfDescriptionCredential } = verifiableSelfDescriptionDto

      const type = selfDescriptionCredential.selfDescription['@type']

      if (!Object.values(this.SD_TYPES).includes(type)) throw new BadRequestException('Provided type for Self Description is not supported')

      let selfDescription = {} as ServiceOfferingSelfDescriptionDto | ParticipantSelfDescriptionDto | any
      let expected = {}

      switch (type) {
        case this.SD_TYPES.PARTICIPANT:
          selfDescription = {
            registrationNumber: undefined,
            legalAddress: undefined,
            headquarterAddress: undefined
          }

          expected = this.expected_participant
          break
        case this.SD_TYPES.SERVICE_OFFERING:
          selfDescription = {
            providedBy: undefined,
            termsAndConditions: undefined
          }

          expected = this.expected_service_offering
          break
      }

      if (!hasExpectedValues(selfDescriptionCredential.selfDescription, expected))
        throw new BadRequestException(`Self Description of type ${type} is missing expected contexts.`)

      // transform self description into parsable JSON
      const keys = Object.keys(selfDescriptionCredential.selfDescription)
      keys.forEach(key => {
        const strippedKey = this.replacePlaceholderInKey(key, type)
        selfDescription[strippedKey] = this.getValueFromShacl(selfDescriptionCredential.selfDescription[key], strippedKey, type)
      })

      return {
        selfDescription,
        proof: selfDescriptionCredential.proof,
        raw: JSON.stringify(selfDescriptionCredential.selfDescription),
        complianceCredential
      }
    } catch (error) {
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }

  private getValueFromShacl(shacl: any, key: string, type: string): any {
    if (type === this.SD_TYPES.PARTICIPANT && this.addressFields.includes(key)) {
      const country = this.getValueFromShacl(shacl['gx-participant:country'], 'country', type)
      const state = this.getValueFromShacl(shacl['gx-participant:state'], 'state', type)

      return { country, state }
    }

    return shacl && typeof shacl === 'object' && '@value' in shacl ? shacl['@value'] : shacl
  }

  private replacePlaceholderInKey(key: string, sdType: string): string {
    const keyType = sdType.substring(0, sdType.lastIndexOf(':') + 1)
    return key.replace(keyType, '')
  }
}
