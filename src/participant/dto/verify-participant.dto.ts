import { ApiProperty } from '@nestjs/swagger'

export class VerifyParticipantDto {
  @ApiProperty({
    description: 'The HTTP location of the Participant Self Description to verify',
    example: 'https://example.eu/path/to/selfdescription'
  })
  public url: string
}
