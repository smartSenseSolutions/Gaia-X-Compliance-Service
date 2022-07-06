import { VerifiableSelfDescriptionDto } from '../../participant/dto'
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { SignedSelfDescriptionDto } from '../dto'
import { SelfDescriptionTypes } from '../enums'
import { getTypeFromSelfDescription } from '../utils'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../constants'

@Injectable()
export class SDParserPipe implements PipeTransform<VerifiableSelfDescriptionDto, SignedSelfDescriptionDto> {
  constructor(private readonly sdType: string) {}

  // TODO extract to common const
  private readonly addressFields = ['legalAddress', 'headquarterAddress']

  transform(verifiableSelfDescriptionDto: VerifiableSelfDescriptionDto): SignedSelfDescriptionDto {
    try {
      const { complianceCredential, selfDescriptionCredential } = verifiableSelfDescriptionDto

      const type = getTypeFromSelfDescription(selfDescriptionCredential)
      if (this.sdType !== type) throw new BadRequestException(`Expected @type of ${this.sdType}`)

      const minimalSelfDescription = this.getMinimalSelfDescription(type)

      const flatSelfDescription = {
        ...(selfDescriptionCredential as any),
        ...(selfDescriptionCredential as any).credentialSubject
      }

      delete flatSelfDescription.credentialSubject

      const keys = Object.keys(flatSelfDescription)

      keys.forEach(key => {
        const strippedKey = this.replacePlaceholderInKey(key, type)
        minimalSelfDescription[strippedKey] = this.getValueFromShacl(flatSelfDescription[key], strippedKey, type)
      })

      return {
        selfDescriptionCredential: minimalSelfDescription,
        proof: selfDescriptionCredential.proof,
        raw: JSON.stringify(flatSelfDescription),
        complianceCredential
      }
    } catch (error) {
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }

  private getMinimalSelfDescription(type: string): any {
    const minimalSelfDescriptions = {
      [SelfDescriptionTypes.SERVICE_OFFERING]: {
        providedBy: undefined,
        termsAndConditions: undefined
      },
      [SelfDescriptionTypes.PARTICIPANT]: {
        registrationNumber: undefined,
        legalAddress: undefined,
        headquarterAddress: undefined
      }
    }

    if (!(type in minimalSelfDescriptions)) throw new BadRequestException(`Provided type of ${type} is not supported.`)

    return minimalSelfDescriptions[type]
  }

  private getValueFromShacl(shacl: any, key: string, type: string): any {
    const addressFields = ['legalAddress', 'headquarterAddress']
    if (type === SelfDescriptionTypes.PARTICIPANT && addressFields.includes(key)) {
      const country = this.getValueFromShacl(shacl['gx-participant:country'], 'country', type)
      const state = this.getValueFromShacl(shacl['gx-participant:state'], 'state', type)

      return { country, state }
    }

    return shacl && typeof shacl === 'object' && '@value' in shacl ? shacl['@value'] : shacl
  }

  private replacePlaceholderInKey(key: string, type: string): string {
    const sdTypes = {
      [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE['@type'],
      [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE['@type']
    }
    const sdType = sdTypes[type]

    const keyType = sdType.substring(0, sdType.lastIndexOf(':') + 1)

    return key.replace(keyType, '')
  }
}
