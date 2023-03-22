import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { SUPPORTED_TYPES } from '../constants'
import { BadRequestException, ConflictException } from '@nestjs/common'

export function getTypeFromSelfDescription(selfDescription: VerifiableCredentialDto<CredentialSubjectDto>): string {
  let type = ''
  if (!selfDescription.credentialSubject.type) {
    type = selfDescription.type.find(t => t !== 'VerifiableCredential')
  } else {
    type = selfDescription.credentialSubject.type
  }
  if (!type) throw new BadRequestException('Expected type to be defined in Self Description credential subject')

  if (!SUPPORTED_TYPES.includes(type)) throw new ConflictException('Provided type for Self Description is not supported')

  return type
}
