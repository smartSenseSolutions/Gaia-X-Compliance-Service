import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { VerifiableCredentialUtils } from '../utils/verifiable-credential.utils'
import { ComplianceCredentialMapper } from './compliance-credential.mapper'
import { CompliantCredentialSubjectMapper } from './compliant-credential-subject-mapper'
import { LabelLevel1CredentialMapper } from './label-level-1-credential.mapper'

export class OutputVerifiableCredentialMapperFactory {
  private static readonly COMPLIANCE_CREDENTIAL_MAPPER: ComplianceCredentialMapper = new ComplianceCredentialMapper()
  private static readonly LABEL_LEVEL_1_CREDENTIAL_MAPPER: LabelLevel1CredentialMapper = new LabelLevel1CredentialMapper()

  static for(verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto>): CompliantCredentialSubjectMapper {
    if (this.isLabelLevel1(verifiableCredential)) {
      return OutputVerifiableCredentialMapperFactory.LABEL_LEVEL_1_CREDENTIAL_MAPPER
    }

    return OutputVerifiableCredentialMapperFactory.COMPLIANCE_CREDENTIAL_MAPPER
  }

  private static isLabelLevel1(verifiableCredential: VerifiableCredentialDto<CredentialSubjectDto>) {
    const gxTypes = VerifiableCredentialUtils.extractGxTypes(verifiableCredential)

    return gxTypes.length === 1 && gxTypes[0] === 'gx:ServiceOfferingLabelLevel1'
  }
}
