import { ApiProperty } from '@nestjs/swagger'

export class ComplianceCredentialDto {
  @ApiProperty({
    description: 'Credential Subject of the Compliance Credential.'
  })
  id: string

  @ApiProperty({
    description: 'Context of the Compliance Credential.'
  })
  hash: string
}
