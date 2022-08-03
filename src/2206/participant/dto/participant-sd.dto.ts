import { AddressDto } from '../../common/dto/address.dto'
import { ApiProperty } from '@nestjs/swagger'
import { ComplianceCredentialDto } from '../../common/dto/compliance-credential.dto'
import { CredentialSubjectDto, VerifiableCredentialDto } from '../../common/dto/credential-meta.dto'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto/service-offering-sd.dto'
import { SignatureDto } from '../../common/dto/signature.dto'
import { RegistrationNumberDto } from './registration-number.dto'

export class ParticipantSelfDescriptionDto extends CredentialSubjectDto {
  @ApiProperty({
    description: 'Registration number(s) which identify one specific company.',
    externalDocs: {
      description: 'For more information see the Trust Framework docs',
      url: 'https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/participant/#registrationnumber'
    }
  })
  public registrationNumber: RegistrationNumberDto[]

  @ApiProperty({
    description: 'Physical location of the companys head quarter.'
  })
  public headquarterAddress: AddressDto

  @ApiProperty({
    description: 'Physical location of the companys legal registration.'
  })
  public legalAddress: AddressDto

  @ApiProperty({
    description: 'SHA512 of the generic Terms and Conditions for Gaia-X Ecosystem as defined in the Trust Framework',
    externalDocs: {
      description: 'Gaia-X Ecosystem Terms and Conditions',
      url: 'https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/participant/#gaia-x-ecosystem-terms-and-conditions'
    }
  })
  public termsAndConditions: string

  @ApiProperty({
    description: 'Unique LEI number as defined by https://www.gleif.org.',
    required: false
  })
  public leiCode?: string

  @ApiProperty({
    description: 'A (list of) direct participant(s) that this entity is a subOrganization of, if any.',
    required: false
  })
  public parentOrganisation?: ParticipantSelfDescriptionDto[]

  @ApiProperty({
    description: 'A (list of) direct participant(s) with a legal mandate on this entity, e.g., as a subsidiary.',
    required: false
  })
  public subOrganisation?: ParticipantSelfDescriptionDto[]
}

export class WrappedComplianceCredentialDto {
  @ApiProperty({
    description: 'Proof and Credential Subject issued by the compliance service.'
  })
  complianceCredential: ComplianceCredentialDto
}

export class VerifiableSelfDescriptionDto {
  @ApiProperty({
    description: 'Self Description created and signed by participant.'
  })
  selfDescriptionCredential: VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto | ParticipantSelfDescriptionDto>

  @ApiProperty({
    description: 'Proof issued by the compliance service.'
  })
  complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto>
}

export class SignedParticipantSelfDescriptionDto {
  public selfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto>

  public proof?: SignatureDto

  public raw: string

  public complianceCredential?: ComplianceCredentialDto
}
