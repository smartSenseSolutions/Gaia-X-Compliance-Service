import { ApiProperty } from '@nestjs/swagger'
import { SignatureDto } from '../../common/dto/signature.dto'
import { ParticipantSelfDescriptionDto } from './participant-sd.dto'
export class VerifyParticipantRawDto {
  @ApiProperty({
    description:
      'The raw Participant Self Description to validate conforming to the [shacl shape located in the Gaia-X Registry](https://registry.lab.gaia-x.eu/shapes/v1/participant.ttl). Find the full definition of a Gaia-X legal person in the [trust framework](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/participant/#legal-person).'
  })
  public selfDescription: ParticipantSelfDescriptionDto

  @ApiProperty({
    description: 'JWS signature of the Self Description'
  })
  public proof: SignatureDto

  @ApiProperty({
    description: 'Credential Subject of the Self Description'
  })
  public credentialSubject?: any
}
