import { Injectable, Logger } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { ValidationResult, VerifiableCredentialDto, VerifiablePresentationDto } from '../dto'
import { ProofService } from './proof.service'
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

const development = 'development'

@Injectable()
export class VerifiablePresentationValidationService {
  readonly logger = new Logger(VerifiablePresentationValidationService.name)

  constructor(
    private proofService: ProofService,
    private shaclService: ShaclService,
    private trustFramework2210ValidationService: TrustFramework2210ValidationService
  ) {}

  static getUUIDStartingWithALetter() {
    let uuid = uuidv4()
    while (!isNaN(uuid[0])) {
      uuid = uuidv4()
    }
    return uuid
  }

  public async validateVerifiablePresentation(vp: VerifiablePresentation): Promise<ValidationResult> {
    const VPUUID = VerifiablePresentationValidationService.getUUIDStartingWithALetter()
    this.logger.debug('Processing VP ' + VPUUID, vp)
    this.logger.log(`Validate signature of VCs ${VPUUID}`)
    await this.validateSignatureOfVCs(vp)
    this.logger.log(`Validate VP & VCs structure ${VPUUID}`)
    const validationResult = await this.validateVPAndVCsStructure(vp)
    if (!validationResult.conforms) {
      this.logger.warn(`Structural validation failed ${VPUUID} ${JSON.stringify(validationResult.results)}`)
      return validationResult
    }
    this.logger.log(`Validate business rules ${VPUUID}`)
    const businessRulesValidationResult = await this.validateBusinessRules(vp, VPUUID)
    if (!businessRulesValidationResult.conforms) {
      this.logger.warn(`Business validation failed ${VPUUID} ${JSON.stringify(businessRulesValidationResult.results)}`)
      return businessRulesValidationResult
    }
    this.logger.log(`Validation success ${VPUUID}`)
    return mergeResults(validationResult, businessRulesValidationResult)
  }

  public async validateSignatureOfVCs(vp: VerifiablePresentation) {
    await Promise.all(vp.verifiableCredential.map(vc => this.proofService.validate(vc)))
  }

  public async validateVPAndVCsStructure(vp: VerifiablePresentation): Promise<ValidationResult> {
    return await this.shaclService.verifyShape(vp, development)
  }

  public async validateBusinessRules(vp: VerifiablePresentation, VPUUID: string): Promise<ValidationResult> {
    return await this.trustFramework2210ValidationService.validate(vp, VPUUID)
  }
}
