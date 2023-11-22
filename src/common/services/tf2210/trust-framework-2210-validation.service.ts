import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import * as jsonld from 'jsonld'
import { firstValueFrom } from 'rxjs'
import { ParticipantSelfDescriptionDto } from '../../../participant/dto'
import { ParticipantContentValidationService } from '../../../participant/services/participant-content-validation.service'
import { ServiceOfferingContentValidationService } from '../../../service-offering/services/service-offering-content-validation.service'
import { ServiceOfferingLabelLevelValidationService } from '../../../service-offering/services/service-offering-label-level-validation.service'
import { ValidationResult } from '../../dto'
import { getAtomicType } from '../../utils/getAtomicType'
import { graphValueFormat } from '../../utils/graph-value-format'
import { VcQueryService } from '../vc-query.service'
import { mergeResults, VerifiablePresentation } from '../verifiable-presentation-validation.service'

@Injectable()
export class TrustFramework2210ValidationService {
  readonly registryUrl = process.env.REGISTRY_URL || 'https://registry.gaia-x.eu/development'
  readonly logger = new Logger(TrustFramework2210ValidationService.name)
  trustedNotaryIssuersCache?: Array<string> = []

  constructor(
    private participantValidationService: ParticipantContentValidationService,
    private serviceOfferingValidationService: ServiceOfferingContentValidationService,
    private serviceOfferingLabelLevelValidationService: ServiceOfferingLabelLevelValidationService,
    private vcQueryService: VcQueryService,
    private httpService: HttpService
  ) {
    //Empty constructor
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  clearTrustedNotaryIssuersCache() {
    this.logger.log('Clearing up trustedNotaryIssuers cache')
    this.trustedNotaryIssuersCache = null
  }

  async validate(vp: VerifiablePresentation, VPUUID: string): Promise<ValidationResult> {
    const validationResults: ValidationResult[] = []
    await this.insertVPInDB(vp, VPUUID)
    await this.verifyCredentialIssuersTermsAndConditions(VPUUID)

    let hasLegalParticipant = false
    let hasServiceOffering = false
    let hasServiceOfferingLabelLevel1 = false
    for (const vc of vp.verifiableCredential) {
      const atomicType = getAtomicType(vc)
      if (atomicType.indexOf('ServiceOffering') > -1) {
        hasServiceOffering = true
      }
      if (atomicType.indexOf('ServiceOfferingLabelLevel1') > -1) {
        hasServiceOfferingLabelLevel1 = true
      }
      if (atomicType.indexOf('LegalParticipant') > -1) {
        validationResults.push(await this.participantValidationService.validate(<ParticipantSelfDescriptionDto>(<unknown>vc.credentialSubject)))
        hasLegalParticipant = true
      }
    }

    // Trigger LegalRegistrationNumber validations if there is a participant in the VP
    if (hasLegalParticipant) {
      validationResults.push(await this.verifyLegalRegistrationNumber(VPUUID))
    }
    if (hasServiceOffering) {
      validationResults.push(await this.serviceOfferingValidationService.validate(VPUUID))
    }
    if (hasServiceOfferingLabelLevel1) {
      validationResults.push(await this.serviceOfferingLabelLevelValidationService.validate(VPUUID))
    }

    this.vcQueryService.cleanupVP(VPUUID).then(() => this.logger.log(`DB Cleanup for VPUUID ${VPUUID}`))
    return mergeResults(...validationResults)
  }

  /**
   * By TF 2210, the LegalParticipant should have at least a  LegalRegistrationNumber issued by a trusted Notary
   * Control is disabled when not in production
   */
  async verifyLegalRegistrationNumber(VPUUID: string): Promise<ValidationResult> {
    const results = new ValidationResult()
    // Issued from trusted issuer
    this.logger.debug(`Searching for LRN Issuer VPUUID:${VPUUID}`)
    const legalRegistrationNumberIssuer = await this.vcQueryService.searchForLRNIssuer(VPUUID)
    if (!legalRegistrationNumberIssuer || legalRegistrationNumberIssuer.length === 0) {
      this.logger.warn(`Unable to find a VerifiableCredential containing the legalRegistrationNumber issued by a notary for VPUID ${VPUUID}`)
      results.conforms = false
      results.results = ['Unable to find a VerifiableCredential containing the legalRegistrationNumber issued by a notary']
      return results
    }
    if (process.env.production === 'true') {
      return await this.checkLegalRegistrationNumberIsTrusted(VPUUID, legalRegistrationNumberIssuer[0])
    }
    return results
  }

  private async checkLegalRegistrationNumberIsTrusted(VPUUID: string, legalRegistrationNumberIssuer: string): Promise<ValidationResult> {
    const results = new ValidationResult()
    const trustedIssuers = await this.retrieveTrustedNotaryIssuers()
    results.conforms = trustedIssuers.findIndex(issuers => issuers.indexOf(graphValueFormat(legalRegistrationNumberIssuer)) > -1) > -1
    if (!results.conforms) {
      this.logger.warn(
        `The issuer of the LegalRegistrationNumber VerifiableCredential is not trusted for VPUID ${VPUUID} ${legalRegistrationNumberIssuer} `
      )
      results.results.push('The issuer of the LegalRegistrationNumber VerifiableCredential is not trusted')
    }
    this.logger.log(`LRN issuer trusted for VPUID ${VPUUID}`)
    return results
  }

  private async retrieveTrustedNotaryIssuers() {
    if (this.trustedNotaryIssuersCache === null) {
      this.trustedNotaryIssuersCache = (
        await firstValueFrom(this.httpService.get<Array<string>>(`${this.registryUrl}/api/trusted-issuers/registration-notary`))
      ).data
    }
    return this.trustedNotaryIssuersCache
  }

  private async insertVPInDB(vp: VerifiablePresentation, VPUUID: string) {
    const quads = await jsonld.toRDF(vp, { format: 'application/n-quads' })
    //Present
    this.logger.debug(`Inserting quads in db VPUUID:${VPUUID}`)
    await this.vcQueryService.insertQuads(VPUUID, quads)
  }

  private async verifyCredentialIssuersTermsAndConditions(VPUUID: string): Promise<ValidationResult> {
    const results = new ValidationResult()
    const trustedIssuers = await this.retrieveTrustedNotaryIssuers()
    const issuers = await this.vcQueryService.retrieveIssuers(VPUUID)
    const issuersTsAndCs = await this.vcQueryService.retrieveTermsAndConditionsIssuers(VPUUID)
    let issuersWithoutTsAndCs = issuers.filter(issuer => issuersTsAndCs.indexOf(issuer) === -1 && trustedIssuers.indexOf(issuer) === -1)

    if (process.env.production !== 'true') {
      issuersWithoutTsAndCs = issuersWithoutTsAndCs.filter(issuer => issuer.indexOf('gaia-x.eu') === -1)
    }

    if (issuersWithoutTsAndCs != null && issuersWithoutTsAndCs.length > 0) {
      results.conforms = false
      const issuersWithoutTsAndCsStr = JSON.stringify(issuersWithoutTsAndCs)
      this.logger.warn(`One or more VCs issuers are missing their termsAndConditions for VPUID ${VPUUID} ${issuersWithoutTsAndCsStr} `)
      results.results.push(`One or more VCs issuers are missing their termsAndConditions  ${issuersWithoutTsAndCsStr}`)
    }
    this.logger.log(`All issuers have T&Cs for VPUID ${VPUUID}`)
    return results
  }
}
