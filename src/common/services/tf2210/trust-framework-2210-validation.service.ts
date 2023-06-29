import { Injectable } from '@nestjs/common'
import { mergeResults, VerifiablePresentation } from '../verifiable-presentation-validation.service'
import { ValidationResult } from '../../dto'
import { ParticipantContentValidationService } from '../../../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from '../../../service-offering/services/content-validation.service'
import { ParticipantSelfDescriptionDto } from '../../../participant/dto'
import { getAtomicType } from '../../utils/getAtomicType'
import * as jsonld from 'jsonld'
import { VcQueryService } from '../vc-query.service'
import { v4 as uuidv4 } from 'uuid'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class TrustFramework2210ValidationService {
  readonly registryUrl = process.env.REGISTRY_URL || 'https://registry.gaia-x.eu/development'

  constructor(
    private participantValidationService: ParticipantContentValidationService,
    private serviceOfferingValidationService: ServiceOfferingContentValidationService,
    private vcQueryService: VcQueryService,
    private httpService: HttpService
  ) {
    //Empty constructor
  }

  async validate(vp: VerifiablePresentation): Promise<ValidationResult> {
    const validationResults: ValidationResult[] = []
    let hasLegalParticipant = false
    for (const vc of vp.verifiableCredential) {
      const atomicType = getAtomicType(vc)
      if (atomicType === 'LegalParticipant') {
        validationResults.push(await this.participantValidationService.validate(<ParticipantSelfDescriptionDto>(<unknown>vc.credentialSubject)))
        hasLegalParticipant = true
      }
    }
    // Trigger LegalRegistrationNumber validations if there is a participant in the VP
    if (hasLegalParticipant) {
      validationResults.push(await this.verifyLegalRegistrationNumber(vp))
    }
    return mergeResults(...validationResults)
  }

  /**
   * By TF 2210, the LegalParticipant should have at least a  LegalRegistrationNumber issued by a trusted Notary
   * Control is disabled when not in production
   */
  async verifyLegalRegistrationNumber(vp: VerifiablePresentation): Promise<ValidationResult> {
    const results = new ValidationResult()
    results.conforms = true
    const quads = await jsonld.toRDF(vp, { format: 'application/n-quads' })
    const VPUUID = this.getUUIDStartingWithALetter()
    //Present
    console.debug(`Inserting quads in db VPUUID:${VPUUID}`)
    await this.vcQueryService.insertQuads(VPUUID, quads)
    console.debug(`Inserted quads in db VPUUID:${VPUUID}`)
    // Issued from trusted issuer
    console.debug(`Searching for LRNIssuer VPUUID:${VPUUID}`)
    const legalRegistrationNumberIssuer = await this.vcQueryService.searchForLRNIssuer(VPUUID)
    if (!legalRegistrationNumberIssuer) {
      results.conforms = false
      results.results = ['Unable to find a VerifiableCredential containing the legalRegistrationNumber issued by a notary']
      return results
    }
    if (process.env.production === 'true') {
      return await this.checkLegalRegistrationNumberIsTrusted(legalRegistrationNumberIssuer)
    }
    return results
  }

  getUUIDStartingWithALetter() {
    let uuid = uuidv4()
    while (!isNaN(uuid[0])) {
      uuid = uuidv4()
    }
    return uuid
  }

  private async checkLegalRegistrationNumberIsTrusted(legalRegistrationNumberIssuer: string): Promise<ValidationResult> {
    const results = new ValidationResult()
    const trustedIssuers = (await firstValueFrom(this.httpService.get<Array<string>>(`${this.registryUrl}/api/trusted-issuers/registration-notary`)))
      .data
    results.conforms = trustedIssuers.findIndex(issuers => issuers.indexOf(this.prepareLRNForComparison(legalRegistrationNumberIssuer)) > -1) > -1
    if (!results.conforms) {
      results.results.push('The issuer of the LegalRegistrationNumber VerifiableCredential is not trusted')
    }
    return results
  }

  prepareLRNForComparison(legalRegistrationNumberIssuer: string): string {
    return legalRegistrationNumberIssuer
      .replace(/[<>]/g, '')
      .replace('did:web:', '')
      .replace(/https?/, '')
      .replace('::', '/')
  }
}
