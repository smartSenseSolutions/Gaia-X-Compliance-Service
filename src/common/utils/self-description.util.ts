import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { SUPPORTED_TYPES } from '../constants'
import { BadRequestException, ConflictException } from '@nestjs/common'

export function getTypeFromSelfDescription(selfDescription: VerifiableCredentialDto<CredentialSubjectDto>): string {
  const types = selfDescription.type
  if (!types) throw new BadRequestException('Expected type to be defined in Self Description')

  const type: string = types.find(t => t !== 'VerifiableCredential')
  if (!SUPPORTED_TYPES.includes(type)) throw new ConflictException('Provided type for Self Description is not supported')

  return type
}

/**
 Allows to retrieve the main type vc in a vc array (Participant / Service-Offering)
@returns main VC
**/

export function getMainVc(vcs: VerifiableCredentialDto<CredentialSubjectDto>[]) {
  for (let i = 0; i < vcs.length; i++) {
    const type = getTypeFromSelfDescription(vcs[i])
    if (type == 'LegalPerson' || type == 'ServiceOfferingExperimental') {
      return vcs[i]
    }
  }
}
