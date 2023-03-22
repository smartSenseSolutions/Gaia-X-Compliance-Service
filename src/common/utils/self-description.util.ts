import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { BadRequestException } from '@nestjs/common'

export function getTypeFromSelfDescription(selfDescription: VerifiableCredentialDto<CredentialSubjectDto>): string {
  const types = selfDescription.type
  if (!types) throw new BadRequestException('Expected type to be defined in Self Description')

  return types.find(t => t !== 'VerifiableCredential')
}
