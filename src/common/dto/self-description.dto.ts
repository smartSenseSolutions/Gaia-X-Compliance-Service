import { ApiProperty } from '@nestjs/swagger'
import { SignatureDto } from './signature.dto'
export abstract class SelfDescriptionMetaDto {
  @ApiProperty({
    description: 'The context to be used for the self description.'
  })
  public '@context': { [key: string]: string }

  @ApiProperty({
    description: 'The type of the self description.'
  })
  public '@type': string

  @ApiProperty({
    description: 'The identifier of the self description.'
  })
  public '@id': string
}

export class WrappedSelfDescriptionDto<T extends SelfDescriptionMetaDto> {
  public selfDescription: T
}

export class VerifySdDto {
  @ApiProperty({
    description: 'The HTTP location of the Self Description to verify',
    example: 'https://example.eu/path/to/selfdescription'
  })
  public url: string
}

export class SignedSelfDescriptionDto {
  public selfDescriptionCredential: any //VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>

  public proof?: SignatureDto

  public raw: string

  public complianceCredential?: any // VerifiableCredentialDto<ComplianceCredentialDto>
}
