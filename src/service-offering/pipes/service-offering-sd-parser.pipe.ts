import { Injectable, BadRequestException } from '@nestjs/common'
import { hasExpectedValues } from '../../common/utils'
import { VerifiableSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import { ServiceOfferingSelfDescriptionDto, SignedServiceOfferingSelfDescriptionDto } from '../dto/service-offering-sd.dto'
@Injectable()
export class ServiceOfferingSDParserPipe {
  private readonly expected = {
    '@context': {
      'gx-participant': 'http://w3id.org/gaia-x/participant#',
      'gx-resource': 'http://w3id.org/gaia-x/resource#',
      'gx-service-offering': 'http://w3id.org/gaia-x/service-offering#'
    },
    '@type': 'gx-service-offering:ServiceOffering'
  }
  // TODO UPDATE FOR SERVICE OFFERING
  transform(serviceOffering: VerifiableSelfDescriptionDto): SignedServiceOfferingSelfDescriptionDto {
    try {
      const { complianceCredential, selfDescriptionCredential } = serviceOffering
      const selfDescription = {
        providedBy: undefined,
        termsAndConditions: undefined
      } as ServiceOfferingSelfDescriptionDto

      if (!hasExpectedValues(selfDescriptionCredential.selfDescription, this.expected))
        throw new BadRequestException(
          'Self Description is expected to be of type gx-service-offering:ServiceOffering (http://w3id.org/gaia-x/service-offering#)'
        )

      // transform self description into parsable JSON
      const keys = Object.keys(selfDescriptionCredential.selfDescription)
      keys.forEach(key => {
        const strippedKey = this.replacePlaceholderInKey(key)
        selfDescription[strippedKey] = this.getValueFromShacl(selfDescriptionCredential.selfDescription[key], strippedKey)
      })

      return {
        selfDescription,
        proof: selfDescriptionCredential.proof,
        raw: JSON.stringify(selfDescriptionCredential.selfDescription),
        complianceCredential
      }
    } catch (error) {
      console.error(error)
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }

  private getValueFromShacl(shacl: any, key: string): any {
    return shacl && typeof shacl === 'object' && '@value' in shacl ? shacl['@value'] : shacl
  }

  private replacePlaceholderInKey(key: string): string {
    return key.replace('gx-service-offering:', '')
  }
}
