import { ApiProperty } from '@nestjs/swagger'
import { VerifiableCredentialDto, ComplianceCredentialDto } from './'


export class oidcCacheElement {
  @ApiProperty({
    description: 'ID of the request'
  })
  id: string

  @ApiProperty({
    description: 'Compliance credential emitted'
  })
  credential: VerifiableCredentialDto<ComplianceCredentialDto>
}
