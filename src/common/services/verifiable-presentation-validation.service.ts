import { Injectable } from '@nestjs/common'
import { ProofService } from './proof.service'
import { ValidationResult, VerifiableCredentialDto, VerifiablePresentationDto } from '../dto'
import { ShaclService } from './shacl.service'
import { getAtomicType, TrustFramework2210ValidationService } from './tf2210/trust-framework-2210-validation.service'

export type VerifiablePresentation = VerifiablePresentationDto<VerifiableCredentialDto<any>>

export function mergeResults(...results: ValidationResult[]): ValidationResult {
  const resultArray = results.map(res => res.results)
  const res = resultArray.reduce((p, c) => c.concat(p))

  return {
    conforms: results.filter(r => !r.conforms).length == 0,
    results: res
  }
}

@Injectable()
export class VerifiablePresentationValidationService {
  constructor(
    private proofService: ProofService,
    private shaclService: ShaclService,
    private trustFramework2210ValidationService: TrustFramework2210ValidationService
  ) {}

  public async validateVerifiablePresentation(vp: VerifiablePresentation): Promise<ValidationResult> {
    await this.validateSignatureOfVCs(vp)
    const validationResult = await this.validateVPAndVCsStructure(vp)
    if (!validationResult.conforms) {
      return validationResult
    }
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
    let mergedValidations: ValidationResult = { conforms: true, results: [] }
    for (const vc of vp.verifiableCredential) {
      mergedValidations = mergeResults(mergedValidations, await this.shaclService.verifyShape(JSON.stringify(vc), getAtomicType(vc.type)))
    }
    return mergedValidations
  }

  public async validateBusinessRules(vp: VerifiablePresentation): Promise<ValidationResult> {
    return await this.trustFramework2210ValidationService.validate(vp)
  }
}
