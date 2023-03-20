import { Injectable } from '@nestjs/common'
import { ServiceOfferingSelfDescriptionDto } from '../dto'
import { ValidationResult, VerifiableCredentialDto } from '../../common/dto'
import { ProofService } from '../../common/services'
import { HttpService } from '@nestjs/axios'
import typer from 'media-typer'
import { webResolver } from '../../common/utils'

@Injectable()
export class ServiceOfferingContentValidationService {
  constructor(private readonly proofService: ProofService, private readonly httpService: HttpService) {}

  async validate(serviceOfferingSD: VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto>): Promise<ValidationResult> {
    const results = []
    const data = serviceOfferingSD.credentialSubject
    results.push(await this.checkDataProtectionRegime(data?.dataProtectionRegime))
    results.push(await this.checkDataExport(data?.dataExport))
    results.push(await this.CSR06_CheckDid(serviceOfferingSD))
    results.push(await this.CSR04_Checkhttp(serviceOfferingSD))
    const mergedResults: ValidationResult = this.mergeResults(...results)

    return mergedResults
  }

  async checkKeyChainProvider(Participant_SDCredential: any, Service_offering_SDCredential: any): Promise<ValidationResult> {
    //Only key comparison for now
    const result = { conforms: true, results: [] }
    const key_Participant = await this.proofService.getPublicKeys(Participant_SDCredential)
    const key_Service = await this.proofService.getPublicKeys(Service_offering_SDCredential)
    if (!key_Participant.publicKeyJwk || !key_Service.publicKeyJwk) {
      result.conforms = false
      result.results.push('KeychainCheck: Key cannot be retrieved')
    }
    const raw_participant = await this.proofService.loadCertificatesRaw(key_Participant.x5u)
    const raw_SO = await this.proofService.loadCertificatesRaw(key_Service.x5u)
    const SO_certificate_chain = raw_SO.split('-----END CERTIFICATE-----')
    const Participant_certificate_chain = raw_participant.split('-----END CERTIFICATE-----')
    SO_certificate_chain.pop()
    Participant_certificate_chain.pop()
    if (this.compare(SO_certificate_chain, Participant_certificate_chain) == false) {
      result.conforms = false
      result.results.push('KeychainCheck: Keys are not from the same keychain')
    }
    return result
  }

  compare(certchain1, certchain2): boolean {
    let includes = false
    for (let i = 0; i < certchain1.length; i++) {
      if (certchain2.includes(certchain1[i])) {
        includes = true
        break
      }
    }
    return includes
  }

  checkDataProtectionRegime(dataProtectionRegime: any): ValidationResult {
    const dataProtectionRegimeList = ['GDPR2016', 'LGPD2019', 'PDPA2012', 'CCPA2018', 'VCDPA2021']
    const result = { conforms: true, results: [] }

    if (dataProtectionRegime && !dataProtectionRegimeList.includes(dataProtectionRegime[0])) {
      result.conforms = false
      result.results.push(`dataProtectionRegime: ${dataProtectionRegime} is not a valid dataProtectionRegime`)
    }

    return result
  }

  checkDataExport(dataExport: any): ValidationResult {
    const requestTypes = ['API', 'email', 'webform', 'unregisteredLetter', 'registeredLetter', 'supportCenter']
    const accessTypes = ['digital', 'physical']
    const result = { conforms: true, results: [] }

    if (!dataExport) {
      return { conforms: false, results: ['dataExport: types are missing.'] }
    } else {
      for (let i = 0; i < dataExport.length; i++) {
        if (dataExport[i]['gx-service-offering:requestType'] && !requestTypes.includes(dataExport[i]['gx-service-offering:requestType'])) {
          result.conforms = false
          result.results.push(`requestType: ${dataExport[i]['gx-service-offering:requestType']} is not a valid requestType`)
        }

        if (dataExport[i]['gx-service-offering:accessType'] && !accessTypes.includes(dataExport[i]['gx-service-offering:accessType'])) {
          result.conforms = false
          result.results.push(`accessType: ${dataExport[i]['gx-service-offering:accessType']} is not a valid accessType`)
        }

        if (dataExport[i]['gx-service-offering:formatType'] && !typer.test(dataExport[i]['gx-service-offering:formatType'])) {
          result.conforms = false
          result.results.push(`formatType: ${dataExport[i]['gx-service-offering:formatType']} is not a valid formatType`)
        }
      }

      return result
    }
  }

  parseJSONLD(jsonLD, type: string, values = [], tab = []) {
    for (const key in jsonLD) {
      if (jsonLD.hasOwnProperty(key)) {
        const element = jsonLD[key]
        if (typeof element === 'object') {
          this.parseJSONLD(element, type, values, tab)
        } else {
          values.push(element)
        }
      }
    }
    for (let i = 0; i < values.length; i++) {
      if (values[i].includes(type)) {
        tab.push(values[i])
      }
    }
    return tab.filter((item, index) => tab.indexOf(item) === index)
  }

  async checkDidUrls(arrayDids, invalidUrls = []) {
    await Promise.all(
      arrayDids.map(async element => {
        try {
          const url = webResolver(element)
          await this.httpService.get(url).toPromise()
        } catch (e) {
          invalidUrls.push(element)
        }
      })
    )
    return invalidUrls
  }

  async CSR06_CheckDid(jsonLd): Promise<ValidationResult> {
    const invalidUrls = await this.checkDidUrls(this.parseJSONLD(jsonLd, 'did:web:'))
    const isValid = invalidUrls.length == 0
    return { conforms: isValid, results: invalidUrls }
  }

  async CSR04_Checkhttp(jsonLd): Promise<ValidationResult> {
    const invalidUrls = await this.checkUrls(this.parseJSONLD(jsonLd, 'https://'))
    const isValid = invalidUrls.length == 0
    return { conforms: isValid, results: invalidUrls }
  }

  async checkUrls(array, invalidUrls = []) {
    await Promise.all(
      array.map(async element => {
        try {
          await this.httpService.get(element).toPromise()
        } catch (e) {
          invalidUrls.push(element)
        }
      })
    )
    return invalidUrls
  }

  private mergeResults(...results: ValidationResult[]): ValidationResult {
    const resultArray = results.map(res => res.results)
    const res = resultArray.reduce((p, c) => c.concat(p))

    return {
      conforms: results.filter(r => !r.conforms).length == 0,
      results: res
    }
  }
}
