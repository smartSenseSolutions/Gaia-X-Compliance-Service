import { CompliantCredentialSubjectMapper } from './compliant-credential-subject-mapper'

export class ComplianceCredentialMapper extends CompliantCredentialSubjectMapper {
  type(): string {
    return 'gx:compliance'
  }
}
