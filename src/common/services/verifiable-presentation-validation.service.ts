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
const log = new Logger('VP service')
@Injectable()
export class VerifiablePresentationValidationService {
  constructor(
    private proofService: ProofService,
    private shaclService: ShaclService,
    private trustFramework2210ValidationService: TrustFramework2210ValidationService
  ) {}

  public async validateVerifiablePresentation(vp: VerifiablePresentation, signedWithWalt: boolean): Promise<ValidationResult> {
    log.log('Incoming Verification for vp of ', JSON.stringify(vp))
    await this.validateSignatureOfVCs(vp, signedWithWalt)
    log.log('Signature passed ')
    const validationResult = await this.validateVPAndVCsStructure(vp)
    log.log('Shape verification passed')
    if (!validationResult.conforms) {
      return validationResult
    }
    const businessRulesValidationResult = await this.validateBusinessRules(vp)
    if (!businessRulesValidationResult.conforms) {
      return businessRulesValidationResult
    }
    return mergeResults(validationResult, businessRulesValidationResult)
  }

  public async validateSignatureOfVCs(vp: VerifiablePresentation, signedWithWalt: boolean) {
    for (const vc of vp.verifiableCredential) {
      await this.proofService.validate(vc, signedWithWalt)
    }
  }

  public async validateVPAndVCsStructure(vp: VerifiablePresentation): Promise<ValidationResult> {
    return await this.shaclService.verifyShape(vp, trustframework)
  }

  public async validateBusinessRules(vp: VerifiablePresentation): Promise<ValidationResult> {
    return await this.trustFramework2210ValidationService.validate(vp)
  }
}
