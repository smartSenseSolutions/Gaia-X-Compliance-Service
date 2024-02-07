import { ApiProperty } from '@nestjs/swagger'
import { Proof, VerifiableCredential } from '@gaia-x/json-web-signature-2020'

export abstract class VerifiableCredentialDto<T extends CredentialSubjectDto> implements VerifiableCredential {
  @ApiProperty({
    description: 'The context to be used for the self description.'
  })
  public '@context': string[] | any

  @ApiProperty({
    description: 'The type of the self description.'
  })
  public type: string | string[]

  @ApiProperty({
    description: 'The identifier of the self description.',
    required: false
  })
  public id?: string

  @ApiProperty({
    description: 'The claims of the credential.'
  })
  public credentialSubject: T | T[]

  @ApiProperty({
    description: 'The identifier of the issuer of the credential.'
  })
  public issuer: string

  @ApiProperty({
    description: 'The expiration date of the credential.'
  })
  public expirationDate?: string

  @ApiProperty({
    description: 'The date of issuance of the credential.'
  })
  public issuanceDate: string

  @ApiProperty({
    description: 'The proof of the credential.'
  })
  public proof: Proof
}

export abstract class CredentialSubjectDto {
  @ApiProperty({
    description: 'The identifier of the credential subject.'
  })
  public 'id': string

  @ApiProperty({
    description: 'The type of the credential subject'
  })
  public type?: string | string[]
}
