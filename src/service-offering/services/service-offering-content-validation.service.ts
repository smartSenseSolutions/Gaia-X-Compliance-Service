import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ValidationResult } from '../../common/dto'
import { ProofService } from '../../common/services'
import { VcQueryService } from '../../common/services/vc-query.service'

@Injectable()
export class ServiceOfferingContentValidationService {
  constructor(private readonly proofService: ProofService, private readonly httpService: HttpService, private vcQueryService: VcQueryService) {}

  validate = async (VPUUID: string): Promise<ValidationResult> => {
    let validationResults = { conforms: true, results: [] }
    const issuersValidation = await this.validateIssuers(VPUUID)
    if (await this.vcQueryService.hasDataResource(VPUUID)) {
      const dataResourceValidation = await this.validateDataResourceParticipantIssuers(VPUUID)
      const dataPIIValdiation = await this.validatePII(VPUUID)
      validationResults = this.mergeResults(validationResults, dataResourceValidation, dataPIIValdiation)
    }

    return this.mergeResults(validationResults, issuersValidation)
  }

  /**
   * Checks participant & serviceOffering are issued from the same keychain
   */
  validateIssuers = async (VPUUID: string): Promise<ValidationResult> => {
    const soIssuerMatchesProvidedByIssuer = await this.vcQueryService.checkServiceOfferingIssuerMatchesProvidedByIssuer(VPUUID)
    return {
      conforms: soIssuerMatchesProvidedByIssuer,
      results: soIssuerMatchesProvidedByIssuer ? [] : ['Service and participant issuers must match']
    }
  }

  validateDataResourceParticipantIssuers = async (VPUUID: string) => {
    const dataResourceAndParticipantIssuers = await this.vcQueryService.checkDataResourceIssuerMatchesProducedByIssuer(VPUUID)
    return {
      conforms: dataResourceAndParticipantIssuers,
      results: dataResourceAndParticipantIssuers ? [] : ['DataResource providedBy and Participant issuers must match']
    }
  }

  /**
   * Checks that when a DataResource has containsPII to true, there's a LegitimeInterest in the VP
   * @param VPUUID the VP UUID in memgraph
   */
  async validatePII(VPUUID: string): Promise<ValidationResult> {
    const hasLegitimateInterestIfContainsPIIOrHasNoPII = await this.vcQueryService.hasLegitimateInterestIfContainsPIIOrHasNoPII(VPUUID)
    return {
      conforms: hasLegitimateInterestIfContainsPIIOrHasNoPII,
      results: hasLegitimateInterestIfContainsPIIOrHasNoPII
        ? []
        : ['A DataResource with containsPII to true requires a LegitimateInterest to be present']
    }
  }

  mergeResults(...results: ValidationResult[]): ValidationResult {
    const resultArray = results.map(res => res.results)
    const res = resultArray.reduce((p, c) => c.concat(p))

    return {
      conforms: results.filter(r => !r.conforms).length == 0,
      results: res
    }
  }
}
