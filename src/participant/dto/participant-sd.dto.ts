import { AddressDto } from '../../common/dto/address.dto'
import { SignatureDto } from '../../common/dto/signature.dto'

export class ParticipantSelfDescriptionDto {
  public registrationNumber: string

  public headquarterAddress: AddressDto

  public legalAddress: AddressDto

  public leiCode?: string

  public parentOrganisation?: ParticipantSelfDescriptionDto[]

  public subOrganisation?: ParticipantSelfDescriptionDto[]
}

export class SignedParticipantSelfDescriptionDto {
  public selfDescription: ParticipantSelfDescriptionDto

  public proof: SignatureDto

  public raw: string
}
