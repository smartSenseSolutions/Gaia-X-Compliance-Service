import { ApiProperty } from '@nestjs/swagger'

export class AddressDto {
  @ApiProperty({
    description: 'Country in ISO 3166-1 alpha2, alpha-3 or numeric format'
  })
  public country: string

  @ApiProperty({
    description: 'State - a two letter state abbreviation is required for US based addresses.',
    required: false
  })
  public state?: string
}

export class AddressDto2206 {
  @ApiProperty({
    description: 'Country principal subdivision code in ISO 3166-2 format'
  })
  public code: string

  @ApiProperty({
    description: 'Country Code in ISO 3166-1 alpha-2 format',
    required: false
  })
  public country_code?: string
}
