import { ApiProperty } from '@nestjs/swagger'

export class ValidationResult {
  @ApiProperty({
    description: 'The data conforms with the given rules or shape'
  })
  public conforms: boolean

  @ApiProperty({
    type: [String],
    description: 'Error messages'
  })
  public results: string[]
}

export class ValidationResultDto {
  @ApiProperty({
    description: 'The data conforms with the given rules and shape and has a valid signature'
  })
  public conforms: boolean

  @ApiProperty({
    description: 'The SHACL Shape validation results'
  })
  public shape: ValidationResult

  @ApiProperty({
    description: 'Content validation results'
  })
  public content: ValidationResult

  @ApiProperty({
    description: 'The signature is valid and belongs to the SD'
  })
  public isValidSignature: boolean
}
