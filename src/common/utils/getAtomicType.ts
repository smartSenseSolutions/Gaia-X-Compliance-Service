import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto'

export function getAtomicType(vc: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>): string | string[] {
  // We can have types in VC & in CS
  // We'll return an array containing all types that are not VerifiableCredential
  const atomicTypes = []
  const vcType = getVCType(vc)
  if (vcType && Array.isArray(vcType) && vcType.filter(t => t !== 'VerifiableCredential').length > 0) {
    atomicTypes.push(...getAtomicTypeFromArray(vcType))
  } else if (vcType && !Array.isArray(vcType) && vcType != 'VerifiableCredential') {
    atomicTypes.push(getAtomicTypeFromString(<string>vcType))
  }

  const csType = getCSType(vc.credentialSubject)
  if (csType && Array.isArray(csType) && csType.filter(t => t !== 'VerifiableCredential').length > 0) {
    atomicTypes.push(...getAtomicTypeFromArray(csType))
  } else if (csType) {
    atomicTypes.push(getAtomicTypeFromString(<string>csType))
  }

  return atomicTypes
}

const getVCType = (vc: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>): string => {
  return vc['@type'] ?? vc.type
}
const getCSType = (credentialSubject: CredentialSubjectDto | CredentialSubjectDto[]): string | string[] => {
  if (Array.isArray(credentialSubject)) {
    return credentialSubject.flatMap(cs => getCSType(cs))
  } else {
    return credentialSubject['@type'] ?? credentialSubject.type
  }
}

function getAtomicTypeFromArray(types: string[]) {
  const nonVCTypes = types.filter(t => t !== 'VerifiableCredential')
  return nonVCTypes.flatMap(type => getAtomicTypeFromString(type))
}

function getAtomicTypeFromString(type: string) {
  return type.substring(type.lastIndexOf(':') + 1)
}
