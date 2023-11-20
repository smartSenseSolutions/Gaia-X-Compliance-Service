import { CompliantCredentialSubjectMapper } from './compliant-credential-subject-mapper'

export class LabelLevel1CredentialMapper extends CompliantCredentialSubjectMapper {
  type(): string {
    return 'gx:labelLevel1'
  }
}
