import { ApiProperty } from '@nestjs/swagger'
import { ComplianceCredentialDto } from '../../common/dto/compliance-credential.dto'
import { CredentialSubjectDto, VerifiableCredentialDto } from '../../common/dto/credential-meta.dto'
import { SignatureDto } from '../../common/dto/signature.dto'
import { TermsAndConditionsDto } from '../../common/dto/terms-and-conditions.dto'

export class ServiceOfferingSelfDescriptionDto extends CredentialSubjectDto {
  @ApiProperty({
    description: 'A resolvable link to the participant Self-Description providing the service.'
  })
  public providedBy: string

  @ApiProperty({
    description: 'Resolvable link(s) to the Self-Description(s) of resources related to the service and that can exist independently of it.',
    type: [String],
    required: false
  })
  public aggregationOf?: string[]

  @ApiProperty({
    description: 'Physical location of the companys legal registration.',
    type: () => [TermsAndConditionsDto]
  })
  public termsAndConditions: TermsAndConditionsDto[]
}

// TODO clean up. Could be replaced by SignedSelfDescriptionDto.
export class SignedServiceOfferingSelfDescriptionDto {
  public selfDescription: ServiceOfferingSelfDescriptionDto

  public proof?: SignatureDto

  public raw: string

  public complianceCredential?: VerifiableCredentialDto<ComplianceCredentialDto>
}
