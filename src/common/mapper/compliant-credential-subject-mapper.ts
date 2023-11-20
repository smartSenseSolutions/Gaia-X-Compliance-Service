import canonicalize from 'canonicalize'
import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { CompliantCredentialSubjectDto } from '../dto/compliant-credential-subject.dto'
import { HashingUtils } from '../utils/hashing.utils'
import { VerifiableCredentialUtils } from '../utils/verifiable-credential.utils'

export abstract class CompliantCredentialSubjectMapper {
  abstract type(): string

  map(verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto>): CompliantCredentialSubjectDto {
    const hash: string = HashingUtils.sha256(canonicalize(verifiableCredential))

    return {
      type: this.type(),
      id: verifiableCredential.id ?? verifiableCredential['@id'],
      'gx:integrity': `sha256-${hash}`,
      'gx:integrityNormalization': 'RFC8785:JCS',
      'gx:version': '22.10',
      'gx:type': VerifiableCredentialUtils.extractGxTypes(verifiableCredential).join(',')
    }
  }
}
