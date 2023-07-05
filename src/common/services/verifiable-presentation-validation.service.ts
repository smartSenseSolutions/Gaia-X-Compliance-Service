import { Injectable, Logger } from '@nestjs/common'
import { ProofService } from './proof.service'
import { ValidationResult, VerifiableCredentialDto, VerifiablePresentationDto } from '../dto'
import { ShaclService } from './shacl.service'
import { TrustFramework2210ValidationService } from './tf2210/trust-framework-2210-validation.service'

export type VerifiablePresentation = VerifiablePresentationDto<VerifiableCredentialDto<any>>

export function mergeResults(...results: ValidationResult[]): ValidationResult {
  if (results && results.length > 0) {
    const resultArray = results.map(res => res.results)
    const res = resultArray.reduce((p, c) => c.concat(p))

    return {
      conforms: results.filter(r => !r.conforms).length == 0,
      results: res
    }
  }
  return { conforms: true, results: [] }
}

const trustframework = 'trustframework'

@Injectable()
export class VerifiablePresentationValidationService {
  readonly logger = new Logger(VerifiablePresentationValidationService.name)
  constructor(
    private proofService: ProofService,
    private shaclService: ShaclService,
    private trustFramework2210ValidationService: TrustFramework2210ValidationService
  ) {}

  public async validateVerifiablePresentation(vp: VerifiablePresentation): Promise<ValidationResult> {
    this.logger.debug('Validate signature of VCs')
    await this.validateSignatureOfVCs(vp)
    this.logger.debug('Validate VP & VCs structure')
    const validationResult = await this.validateVPAndVCsStructure(vp)
    if (!validationResult.conforms) {
      return validationResult
    }
    this.logger.debug('Validate business rules')
    const businessRulesValidationResult = await this.validateBusinessRules(vp)
    if (!businessRulesValidationResult.conforms) {
      return businessRulesValidationResult
    }
    return mergeResults(validationResult, businessRulesValidationResult)
  }

  public async validateSignatureOfVCs(vp: VerifiablePresentation) {
    for (const vc of vp.verifiableCredential) {
      await this.proofService.validate(vc)
    }
  }

  public async validateVPAndVCsStructure(vp: VerifiablePresentation): Promise<ValidationResult> {
    return await this.shaclService.verifyShape(vp, trustframework)
  }

  public async validateBusinessRules(vp: VerifiablePresentation): Promise<ValidationResult> {
    return await this.trustFramework2210ValidationService.validate(vp)
  }
}
