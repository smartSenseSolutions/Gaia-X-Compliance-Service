import { ApiProperty } from '@nestjs/swagger'
import { SignatureDto } from '../../common/dto/signature.dto'

export class VerifyParticipantRawDto {
  @ApiProperty({
    //TODO: replace registry url with .env variable (preview & prod)
    description:
      'The raw Participant Self Description to validate conforming to the [shacl shape located in the Gaia-X Registry](https://registry.lab.gaia-x.eu/shapes/v1/participant.ttl).'
  })
  public selfDescription: any

  @ApiProperty({
    description: 'JWS signature of the Self Description'
  })
  public proof: SignatureDto
}
