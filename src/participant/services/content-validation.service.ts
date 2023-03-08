import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { AddressDto, ValidationResult } from '../../common/dto'
import countryCodes from '../../static/validation/2206/iso-3166-2-country-codes.json'
import countryListEEA from '../../static/validation/country-codes.json'
import { ParticipantSelfDescriptionDto, RegistrationNumberDto } from '../dto'
import { RegistryService } from '../../common/services'
import * as jsonPath from 'jsonpath'
import { webResolver } from '../../common/utils'

@Injectable()
export class ParticipantContentValidationService {
  constructor(private readonly httpService: HttpService, private readonly registryService: RegistryService) {}

  async validate(data: ParticipantSelfDescriptionDto): Promise<ValidationResult> {
    const { legalAddress, leiCode, registrationNumber } = data

    const checkUSAAndValidStateAbbreviation = this.checkUSAAndValidStateAbbreviation(legalAddress)

    const validationPromises: Promise<ValidationResult>[] = []
    validationPromises.push(this.checkRegistrationNumbers(registrationNumber, data))
    validationPromises.push(this.checkValidLeiCode(leiCode, data))
    validationPromises.push(this.CPR08_CheckDid(data))
    const results = await Promise.all(validationPromises)

    return this.mergeResults(...results, checkUSAAndValidStateAbbreviation)
  }

  async validateAll(jsonld): Promise<ValidationResult[]> {
    const selfDescPaths = '$..verifiableCredential[?(@.selfDescriptionCredential)]'

    const dataList = jsonPath.query(jsonld, selfDescPaths)

    const validationPromises: Promise<ValidationResult>[] = dataList.map(data => this.validate(data))
    const results = await Promise.all(validationPromises)
    return results.flat()
  }

  async checkTermsAndConditions(termsAndConditionsHash: string): Promise<ValidationResult> {
    const errorMessage = 'Terms and Conditions does not match against SHA256 of the Generic Terms and Conditions'
    const tac = await this.registryService.getTermsAndConditions()

    return this.validateAgainstObject(tac, tac => tac.hash === termsAndConditionsHash, errorMessage)
  }

  private async getDataFromLeiCode(leiCode: string): Promise<Array<any>> {
    const URL = `https://api.gleif.org/api/v1/lei-records?filter%5Blei%5D=${leiCode}`
    try {
      const res = await this.httpService.get(URL).toPromise()
      return res.data.data
    } catch (error) {
      console.error(error)
    }
  }

  async checkValidLeiCode(leiCode: string, selfDescription: ParticipantSelfDescriptionDto): Promise<ValidationResult> {
    let leiResult = { conforms: true, results: [] }
    if (!leiCode) return leiResult
    const leiData = await this.getLeiData(leiCode)

    if (leiData) leiResult = this.checkValidLeiCountries(leiData, selfDescription)
    else leiResult = { conforms: false, results: ['leiCode: the given leiCode is invalid or does not exist'] }

    return leiResult
  }

  checkValidLeiCountry(leiCountry: string, sdIsoCode: string, path: string): ValidationResult {
    const results = []
    const conforms = this.isValidLeiCountry(leiCountry, sdIsoCode)

    if (!conforms) {
      results.push(`leiCode: the ${path}.country in the lei-record needs to reference the same country as ${path}.code`)
    }

    return { conforms, results }
  }

  checkValidLeiCountries(leiData: any, selfDescription: ParticipantSelfDescriptionDto): ValidationResult {
    const { legalAddress, headquartersAddress } = leiData[0].attributes.entity

    const checkValidLegalLeiCountry = this.checkValidLeiCountry(legalAddress.country, selfDescription.legalAddress?.code, 'legalAddress')
    const checkValidHeadquarterLeiCountry = this.checkValidLeiCountry(
      headquartersAddress.country,
      selfDescription.headquarterAddress?.code,
      'headquarterAddress'
    )

    return this.mergeResults(checkValidLegalLeiCountry, checkValidHeadquarterLeiCountry)
  }

  async getLeiData(leiCode: string): Promise<any> {
    const leiData = await this.getDataFromLeiCode(leiCode)

    const conforms = leiData && leiData[0] && leiData[0].attributes && leiData[0].attributes.entity

    return conforms ? leiData : undefined
  }

  async checkRegistrationNumbers(
    registrationNumber: RegistrationNumberDto[],
    participantSD: ParticipantSelfDescriptionDto
  ): Promise<ValidationResult> {
    try {
      const checkPromises = registrationNumber.map(number => this.checkRegistrationNumber(number, participantSD))
      const checks = await Promise.all(checkPromises)

      return this.mergeResults(...checks)
    } catch (error) {
      console.error(error)
      return {
        conforms: false,
        results: ['registrationNumber could not be verified']
      }
    }
  }

  async checkRegistrationNumber(registrationNumber: RegistrationNumberDto, participantSD: ParticipantSelfDescriptionDto): Promise<ValidationResult> {
    const checks = {
      EORI: 'checkRegistrationNumberEori',
      vatID: 'checkRegistrationNumberVat',
      leiCode: 'checkValidLeiCode',
      EUID: 'checkRegistrationNumberEUID',
      local: 'checkRegistrationNumberLocal'
    }
    try {
      return await this[checks[registrationNumber.type]](registrationNumber.number, participantSD)
    } catch (e) {
      console.error(e)
      return {
        conforms: false,
        results: ['registrationNumber could not be verified']
      }
    }
  }

  private async validateAgainstObject<T>(object: T, validateFn: (obj: T) => boolean, message: string): Promise<ValidationResult> {
    let conforms = false
    const results = [message]

    try {
      conforms = validateFn(object)
      // clear error message from results if conforms = true
      conforms && results.splice(0, results.length)

      return {
        conforms,
        results
      }
    } catch (e) {
      console.error(e.message)
      return {
        conforms,
        results
      }
    }
  }

  private async checkRegistrationNumberLocal(registrationNumber: string, _participantSD: ParticipantSelfDescriptionDto): Promise<ValidationResult> {
    //   //TODO: enable when opencorporates api works again
    //   // const errorMessage = 'registrationNumber could not be verified as valid state issued company number'

    //   // const { headquarterAddress } = participantSD

    //   // const openCorporateBaseUri = 'https://api.opencorporates.com/companies'

    //   // const res = await this.httpService.get(`${openCorporateBaseUri}/${headquarterAddress?.country_code}/${registrationNumber}`).toPromise()

    //   // const { results } = res.data

    const localRegistrationNumberRegex = /^[A-Za-z0-9_ -]*$/

    if (!localRegistrationNumberRegex.test(registrationNumber))
      return this.validateAgainstObject({}, () => false, 'registrationNumber local has the wrong format')

    return this.validateAgainstObject({}, () => true, 'registrationNumber could not be verified') // this.validateAgainstObject(results, res => res?.company?.company_number === registrationNumber, errorMessage)
  }

  // TODO: implement check
  // private async checkRegistrationNumberEUID(registrationNumber: string): Promise<ValidationResult> {
  //   return this.validateAgainstObject({}, () => true, 'registrationNumber could not be verified as valid EUID')
  // }

  private async checkRegistrationNumberVat(vatNumber: string, _countryCode: string): Promise<ValidationResult> {
    //TODO: check what is broken and enable again
    // const errorMessage = 'registrationNumber could not be verified as valid vatID for given country.'
    // const vatServiceWSDLUri = 'https://ec.europa.eu/taxation_customs/vies/checkVatTestService.wsdl'

    // const client = await this.soapService.getSoapClient(vatServiceWSDLUri)
    // const res = await this.soapService.callClientMethod(client, 'checkVat', { countryCode, vatNumber })

    const vatIdRegex = /^[A-Za-z]{2,4}(?=.{2,12}$)[-_ 0-9]*(?:[a-zA-Z][-_ 0-9]*){0,2}$/

    if (!vatIdRegex.test(vatNumber)) return this.validateAgainstObject({}, () => false, 'registrationNumber vatId has the wrong format')

    return this.validateAgainstObject({}, () => true, 'registrationNumber could not be verified') // this.validateAgainstObject(res, res => res.valid, errorMessage)
  }

  // private async checkRegistrationNumberEori(registrationNumber: string): Promise<ValidationResult> {
  //   const errorMessage = 'registrationNumber could not be verified as valid EORI.'
  //   const eoriValidationServiceWSDLUri = 'https://ec.europa.eu/taxation_customs/dds2/eos/validation/services/validation?wsdl'

  //   // const client = await this.soapService.getSoapClient(eoriValidationServiceWSDLUri)
  //   // const res = await this.soapService.callClientMethod(client, 'validateEORI', { eori: registrationNumber })

  //   return this.validateAgainstObject(
  //     res,
  //     res => {
  //       const { result }: { result: { eori: string; status: number; statusDescr: string }[] } = res
  //       return result.find(r => r.eori === registrationNumber).status !== 1
  //     },
  //     errorMessage
  //   )
  // }

  checkUSAAndValidStateAbbreviation(legalAddress: AddressDto): ValidationResult {
    let conforms = true
    const results = []

    const country = this.getISO31662Country(legalAddress?.code)

    if (!country) {
      conforms = false
      results.push('legalAddress.code: needs to be a valid ISO-3166-2 country principal subdivision code')
    }

    return {
      conforms,
      results
    }
  }

  async isISO6523EUID(registrationNumber: string): Promise<boolean> {
    // TODO: implement check on valid  ISO 6523 EUID registration number
    return registrationNumber?.length > 4
  }

  private mergeResults(...results: ValidationResult[]): ValidationResult {
    const resultArray = results.map(res => res.results)
    const res = resultArray.reduce((p, c) => c.concat(p))

    return {
      conforms: results.filter(r => !r.conforms).length == 0,
      results: res
    }
  }

  private getISO31661Country(country: string) {
    return countryListEEA.find(c => {
      return c.alpha2 === country || c.alpha3 === country || c.code === country
    })
  }

  private getISO31662Country(code: string) {
    return countryCodes.find(c => {
      return c.code === code
    })
  }

  // private isEEACountry(code: string): boolean {
  //   const c = this.getISO31662Country(code)

  //   return c && countryListEEA.find(eeaCountry => c.country_code === eeaCountry.alpha2) !== undefined
  // }

  private isValidLeiCountry(leiCountry: string, sdIsoCode: string): boolean {
    const leiCountryISO = this.getISO31661Country(leiCountry)
    const sdCountryISO = this.getISO31662Country(sdIsoCode)

    return leiCountryISO && sdCountryISO ? leiCountryISO?.alpha2 === sdCountryISO?.country_code : false
  }

  parseJSONLD(jsonLD, values = []) {
    for (const key in jsonLD) {
      if (jsonLD.hasOwnProperty(key)) {
        const element = jsonLD[key]
        if (typeof element === 'object') {
          this.parseJSONLD(element, values)
        } else {
          values.push(element)
        }
      }
    }
    return values
  }

  parseDid(jsonLD, tab = []) {
    const values = this.parseJSONLD(jsonLD)
    for (let i = 0; i < values.length; i++) {
      if (values[i].startsWith('did:web:')) {
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

  async CPR08_CheckDid(jsonLd): Promise<ValidationResult> {
    const invalidUrls = await this.checkDidUrls(this.parseDid(jsonLd))
    const isValid = invalidUrls.length == 0
    //return { ruleName: "CPR-08_CheckDid", status: isValid, invalidUrls: invalidUrls }
    return { conforms: isValid, results: invalidUrls }
  }
}
