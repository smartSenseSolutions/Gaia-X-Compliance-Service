import { ApiProperty } from '@nestjs/swagger'

export class VPToken {
  @ApiProperty({
    description: 'VP contained in the presentation submition'
  })
  public vp_token: string

  @ApiProperty({
    description: 'nonce of the presentation submition'
  })
  public state: string

  @ApiProperty({
    description: 'Error messages'
  })
  public presentation_submission?: string
}
