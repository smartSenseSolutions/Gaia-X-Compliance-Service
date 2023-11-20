import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'

export class VerifiableCredentialUtils {
  static extractGxTypes(verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto>): string[] {
    const credentialSubject = verifiableCredential.credentialSubject

    if (Array.isArray(credentialSubject)) {
      return credentialSubject.filter(cs => cs).flatMap(cs => this.extractCredentialSubjectGxType(cs))
    }

    if (!credentialSubject) {
      return []
    }

    return this.extractCredentialSubjectGxType(credentialSubject)
  }

  private static extractCredentialSubjectGxType(credentialSubject: CredentialSubjectDto): string[] {
    const type = credentialSubject.type ?? credentialSubject['@type']

    return Array.isArray(type) ? type : [type]
  }
}
