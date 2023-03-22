import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { AddressDto, CredentialSubjectDto, SignedSelfDescriptionDto, VerifiableSelfDescriptionDto } from '../dto'
import { SelfDescriptionTypes } from '../enums'
import { getTypeFromSelfDescription } from '../utils'
import { RegistrationNumberDto } from '../../participant/dto'

@Injectable()
export class SDParserPipe
  implements PipeTransform<VerifiableSelfDescriptionDto<CredentialSubjectDto>, SignedSelfDescriptionDto<CredentialSubjectDto>>
{
  constructor(private readonly sdType: string) {}

  // TODO extract to common const
  private readonly addressFields = ['legalAddress', 'headquarterAddress']

  transform(verifiableSelfDescriptionDto: VerifiableSelfDescriptionDto<CredentialSubjectDto>): SignedSelfDescriptionDto<CredentialSubjectDto> {
    try {
      const { complianceCredential, selfDescriptionCredential } = verifiableSelfDescriptionDto

      const type = getTypeFromSelfDescription(selfDescriptionCredential)
      if (this.sdType !== type) throw new BadRequestException(`Expected @type of ${this.sdType}`)

      const { credentialSubject } = selfDescriptionCredential
      delete selfDescriptionCredential.credentialSubject

      const flatten = {
        sd: { ...selfDescriptionCredential },
        cs: { ...credentialSubject }
      }

      return {
        selfDescriptionCredential: {
          ...flatten.sd,
          credentialSubject: { ...flatten.cs }
        },
        proof: selfDescriptionCredential.proof,
        raw: JSON.stringify({ ...selfDescriptionCredential, credentialSubject: { ...credentialSubject } }),
        rawCredentialSubject: JSON.stringify({ ...credentialSubject }),
        complianceCredential
      }
    } catch (error) {
      console.log(error)
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }

  private getAddressValues(address: any): AddressDto {
    const code = this.getValueFromShacl(address['gx-participant:addressCode'], 'code', SelfDescriptionTypes.PARTICIPANT)
    const country_code = this.getValueFromShacl(address['gx-participant:addressCountryCode'], 'country_code', SelfDescriptionTypes.PARTICIPANT)

    return { code, country_code }
  }

  private getRegistrationNumberValues(registrationNumber: any): RegistrationNumberDto[] {
    if (registrationNumber.constructor !== Array) registrationNumber = [registrationNumber]

    const values = []
    for (const num of registrationNumber) {
      const rType = this.getValueFromShacl(num['gx-participant:registrationNumberType'], 'type', SelfDescriptionTypes.PARTICIPANT)
      const rNumber = this.getValueFromShacl(num['gx-participant:registrationNumberNumber'], 'number', SelfDescriptionTypes.PARTICIPANT)
      values.push({ type: rType, number: rNumber })
    }
    return values
  }

  private getValueFromShacl(shacl: any, key: string, type: string): any {
    if (type === SelfDescriptionTypes.PARTICIPANT && this.addressFields.includes(key)) {
      return this.getAddressValues(shacl)
    }
    if (type === SelfDescriptionTypes.PARTICIPANT && key === 'registrationNumber') {
      return this.getRegistrationNumberValues(shacl)
    }

    return shacl && typeof shacl === 'object' && '@value' in shacl ? shacl['@value'] : shacl
  }
}
