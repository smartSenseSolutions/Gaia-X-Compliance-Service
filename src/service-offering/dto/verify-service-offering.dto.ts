import { ApiProperty } from '@nestjs/swagger'

export class VerifyServiceOfferingDto {
  @ApiProperty({
    description: 'The HTTP location of the Service Offering Self Description to verify',
    example: 'https://example.eu/path/to/selfdescription'
  })
  public url: string
}
