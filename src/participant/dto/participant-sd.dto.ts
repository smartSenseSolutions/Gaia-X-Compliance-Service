import { ApiProperty } from '@nestjs/swagger'
import { AddressDto } from '../../common/dto/address.dto'
import { SelfDescriptionMetaDto, WrappedSelfDescriptionDto } from '../../common/dto/self-description.dto'
import { SignatureDto } from '../../common/dto/signature.dto'
import ParticipantSDMinimal from '../../tests/fixtures/participant-sd-minimal.json'

export class ParticipantSelfDescriptionDto extends SelfDescriptionMetaDto {
  @ApiProperty({
    description: "The context to be used for the self description. The 'gx-participant' context is required for Participant Self Descriptions",
    example: {
      sh: 'http://www.w3.org/ns/shacl#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      'gx-participant': 'http://w3id.org/gaia-x/participant#'
    }
  })
  public '@context': SelfDescriptionMetaDto['@context']

  @ApiProperty({
    description: "The type of the self description. 'gx-participant:LegalPerson' is required for Participant Self Descriptions.",
    example: 'gx-participant:LegalPerson'
  })
  public '@type': SelfDescriptionMetaDto['@type']

  @ApiProperty({
    description: "Country's registration number which identifies one specific company."
  })
  public registrationNumber: string

  @ApiProperty({
    description: 'Physical location of the companys head quarter.'
  })
  public headquarterAddress: AddressDto

  @ApiProperty({
    description: 'Physical location of the companys legal registration.'
  })
  public legalAddress: AddressDto

  @ApiProperty({
    description: 'Unique LEI number as defined by https://www.gleif.org.',
    required: false
  })
  public leiCode?: string

  @ApiProperty({
    description: 'A (list of) direct participant(s) that this entity is a subOrganization of, if any.',
    required: false,
    type: () => [ParticipantSelfDescriptionDto],
    example: [ParticipantSDMinimal.selfDescriptionCredential.selfDescription]
  })
  public parentOrganisation?: ParticipantSelfDescriptionDto[]

  @ApiProperty({
    description: 'A (list of) direct participant(s) with a legal mandate on this entity, e.g., as a subsidiary.',
    required: false,
    type: () => [ParticipantSelfDescriptionDto],
    example: ParticipantSDMinimal.selfDescriptionCredential.selfDescription
  })
  public subOrganisation?: ParticipantSelfDescriptionDto[]
}

export class WrappedParticipantSelfDescriptionDto implements WrappedSelfDescriptionDto<ParticipantSelfDescriptionDto> {
  @ApiProperty({
    description: 'A wrapped Self Description.'
  })
  public selfDescription: ParticipantSelfDescriptionDto
}

export class SelfDescriptionCredentialDto {
  @ApiProperty({
    description: 'A Self Description that was used for the proof.'
  })
  public selfDescription: ParticipantSelfDescriptionDto | any // TODO add ServiceOfferingSelfDescriptionDto

  @ApiProperty({
    description: 'Participant generated proof of the Self Description.'
  })
  public proof: SignatureDto
}

// TODO clean up
export class ComplianceCredentialDto {
  @ApiProperty({
    description: 'Credential Subject of the Self Description.'
  })
  credentialSubject: any
  @ApiProperty({
    description: 'Gaia-X Compliance Proof for that Self Description.'
  })
  proof: any
}

// TODO clean up
export class VerifiableSelfDescriptionDto {
  @ApiProperty({
    description: 'Self Description created and signed by participant.'
  })
  selfDescriptionCredential: SelfDescriptionCredentialDto

  @ApiProperty({
    description: 'Proof issued by the compliance service.'
  })
  complianceCredential: ComplianceCredentialDto
}

// TODO clean up
export class SignedParticipantSelfDescriptionDto {
  public selfDescription: ParticipantSelfDescriptionDto

  public proof?: SignatureDto

  public raw: string

  public complianceCredential?: ComplianceCredentialDto
}
