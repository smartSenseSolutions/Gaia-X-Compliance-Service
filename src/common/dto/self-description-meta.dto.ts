import { ApiProperty } from '@nestjs/swagger'

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
