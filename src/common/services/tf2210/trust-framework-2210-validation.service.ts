import { Injectable, Logger } from '@nestjs/common'
import { mergeResults, VerifiablePresentation } from '../verifiable-presentation-validation.service'
import { ValidationResult } from '../../dto'
import { ParticipantContentValidationService } from '../../../participant/services/content-validation.service'
import { ParticipantSelfDescriptionDto } from '../../../participant/dto'
import { getAtomicType } from '../../utils/getAtomicType'
import * as jsonld from 'jsonld'
import { VcQueryService } from '../vc-query.service'
import { v4 as uuidv4 } from 'uuid'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { graphValueFormat } from '../../utils/graph-value-format'
const api = require('@opentelemetry/api')

@Injectable()
export class TrustFramework2210ValidationService {
  readonly logger = new Logger(TrustFramework2210ValidationService.name)
  readonly registryUrl = process.env.REGISTRY_URL || 'https://registry.gaia-x.eu/development'

  constructor(
    private participantValidationService: ParticipantContentValidationService,
    private vcQueryService: VcQueryService,
    private httpService: HttpService
  ) {
    //Empty constructor
  }

  async validate(vp: VerifiablePresentation): Promise<ValidationResult> {
    const startVerif = api.trace.getSpan(api.context.active())
    startVerif.addEvent('Start Business Rule Verification', { randomIndex: 1 })
    const validationResults: Promise<ValidationResult>[] = []
    const VPUUID = TrustFramework2210ValidationService.getUUIDStartingWithALetter()
    await this.insertVPInDB(vp, VPUUID)
    startVerif.addEvent('Data is in BaseGraph', { randomIndex: 1 })
    validationResults.push(this.verifyCredentialIssuersTermsAndConditions(VPUUID))
    let hasLegalParticipant = false
    for (const vc of vp.verifiableCredential) {
      const atomicType = getAtomicType(vc)
      if (atomicType === 'LegalParticipant') {
        validationResults.push(this.participantValidationService.validate(<ParticipantSelfDescriptionDto>(<unknown>vc.credentialSubject)))
        hasLegalParticipant = true
      }
      if (hasLegalParticipant) {
        validationResults.push(this.verifyLegalRegistrationNumber(VPUUID))
      }
    }
    let result = await Promise.all(validationResults)
    startVerif.addEvent('End of business Rule Check', { randomIndex: 3 })
    return mergeResults(...result)
  }

  async verifyLegalRegistrationNumber(VPUUID: string): Promise<ValidationResult> {
    const results: ValidationResult = {
      conforms: true,
      results: []
    }
    // Issued from trusted issuer
    this.logger.debug(`Searching for LRNIssuer VPUUID:${VPUUID}`)
    const legalRegistrationNumberIssuer = await this.vcQueryService.searchForLRNIssuer(VPUUID)
    if (!legalRegistrationNumberIssuer || legalRegistrationNumberIssuer.length === 0) {
      this.logger.log(`Unable to find a VerifiableCredential containing the legalRegistrationNumber issued by a notary for VPUID ${VPUUID}`)
      results.conforms = false
      results.results = ['Unable to find a VerifiableCredential containing the legalRegistrationNumber issued by a notary']
      return results
    }
    if (process.env.production === 'true') {
      return await this.checkLegalRegistrationNumberIsTrusted(legalRegistrationNumberIssuer[0])
    }
    return results
  }

  static getUUIDStartingWithALetter() {
    let uuid = uuidv4()
    while (!isNaN(uuid[0])) {
      uuid = uuidv4()
    }
    return uuid
  }

  private async checkLegalRegistrationNumberIsTrusted(legalRegistrationNumberIssuer: string): Promise<ValidationResult> {
    const results = new ValidationResult()
    const trustedIssuers = await this.retrieveTrustedNotaryIssuers()
    results.conforms = trustedIssuers.findIndex(issuers => issuers.indexOf(graphValueFormat(legalRegistrationNumberIssuer)) > -1) > -1
    if (!results.conforms) {
      results.results.push('The issuer of the LegalRegistrationNumber VerifiableCredential is not trusted')
    }
    return results
  }

  private async retrieveTrustedNotaryIssuers() {
    return (await firstValueFrom(this.httpService.get<Array<string>>(`${this.registryUrl}/api/trusted-issuers/registration-notary`))).data
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
      issuersWithoutTsAndCs = issuersWithoutTsAndCs.filter(issuer => issuer.indexOf('gaiax.ovh') === -1)
    }
    this.logger.log(issuersWithoutTsAndCs)

    if (issuersWithoutTsAndCs != null && issuersWithoutTsAndCs.length > 0) {
      results.conforms = false
      results.results.push(`One or more VCs issuers are missing their termsAndConditions ${JSON.stringify(issuersWithoutTsAndCs)}`)
    }
    this.logger.log(`All issuers have T&Cs for VPUID ${VPUUID}`)
    return {
      conforms: true,
      results: []
    }
  }
}
