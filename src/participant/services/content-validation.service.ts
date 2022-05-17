import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ValidationResult } from '../../common/dto/validation-result.dto'
import countryCodes from '../../static/validation/country-codes.json'
import countryListEEA from '../../static/validation/country-codes.json'
import statesUSA from '../../static/validation/us-states.json'
import { ParticipantSelfDescriptionDto } from '../dto/participant-sd.dto'

export interface Address {
  country: string
  state?: string
}

@Injectable()
export class ParticipantContentValidationService {
  constructor(private readonly httpService: HttpService) {}

  async validate(data: ParticipantSelfDescriptionDto): Promise<ValidationResult> {
    const { legalAddress, leiCode, registrationNumber } = data

    const checkEEACountryAndRegistrationNumber = await this.checkEEACountryAndRegistrationNumber(legalAddress, registrationNumber)

    const checkUSAAndValidStateAbbreviation = this.checkUSAAndValidStateAbbreviation(legalAddress)

    const leiResult = await this.checkValidLeiCode(leiCode, data)

    return this.mergeResults(checkEEACountryAndRegistrationNumber, checkUSAAndValidStateAbbreviation, leiResult)
  }

  async getDataFromLeiCode(leiCode: string): Promise<Array<any>> {
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

  checkValidLeiCountry(leiCountry: string, sdCountry: string, path: string): ValidationResult {
    const results = []
    const conforms = this.isValidLeiCountry(leiCountry, sdCountry)

    if (!conforms) {
      results.push(`leiCode: the ${path}.country in the lei-record needs to be equal to the ${path}.country`)
    }

    return { conforms, results }
  }

  checkValidLeiCountries(leiData: any, selfDescription: ParticipantSelfDescriptionDto): ValidationResult {
    const { legalAddress, headquartersAddress } = leiData[0].attributes.entity

    const checkValidLegalLeiCountry = this.checkValidLeiCountry(legalAddress.country, selfDescription.legalAddress?.country, 'legalAddress')
    const checkValidHeadquarterLeiCountry = this.checkValidLeiCountry(
      headquartersAddress.country,
      selfDescription.headquarterAddress?.country,
      'headquarterAddress'
    )

    return this.mergeResults(checkValidLegalLeiCountry, checkValidHeadquarterLeiCountry)
  }

  async getLeiData(leiCode: string): Promise<any> {
    const leiData = await this.getDataFromLeiCode(leiCode)

    const conforms = leiData && leiData[0] && leiData[0].attributes && leiData[0].attributes.entity

    return conforms ? leiData : undefined
  }

  async checkEEACountryAndRegistrationNumber(legalAddress: Address, registrationNumber: string): Promise<ValidationResult> {
    let conforms = true
    const results = []

    if (this.isEEACountry(legalAddress?.country)) {
      conforms = await this.isISO6523EUID(registrationNumber)
      if (!conforms) results.push('registrationNumber: the registration number needs to be a valid EUID')
    }

    return {
      conforms,
      results
    }
  }

  checkUSAAndValidStateAbbreviation(legalAddress: Address): ValidationResult {
    let conforms = true
    const results = []

    const country = this.getISO31661Country(legalAddress?.country)

    if (!country) {
      conforms = false
      results.push('legalAddress.country: country needs to be a valid ISO-3166-1 country name')
    }

    if (country?.alpha3 === 'USA') {
      conforms = this.isValidTwoLetterUSAState(legalAddress.state)
      if (!conforms)
        results.push('legalAddress.state: the given state needs to be a valid two letter abbreviation for legal persons based in the USA')
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

  //TODO: Decide on how to order functions
  private mergeResults(...results: ValidationResult[]): ValidationResult {
    const resultArray = results.map(res => res.results)
    const res = resultArray.reduce((p, c) => c.concat(p))

    return {
      conforms: results.filter(r => !r.conforms).length == 0,
      results: res
    }
  }

  private getISO31661Country(country: string) {
    //TODO: implement with official ISO database
    const result = countryCodes.find(c => {
      return c.alpha2 === country || c.alpha3 === country || c.code === country
    })

    return result
  }

  private isEEACountry(country: string): boolean {
    const c = this.getISO31661Country(country)

    return c && countryListEEA.find(eeaCountry => c.alpha2 === eeaCountry.alpha2) !== undefined
  }

  private isValidTwoLetterUSAState(state: string): boolean {
    return statesUSA.find(s => state === s.abbreviation) !== undefined
  }

  private isValidLeiCountry(leiCountry: string, sdCountry: string): boolean {
    const leiCountryISO = this.getISO31661Country(leiCountry)
    const sdCountryISO = this.getISO31661Country(sdCountry)

    const countryMatches = leiCountryISO && leiCountryISO ? leiCountryISO?.code === sdCountryISO?.code : false

    return countryMatches
  }
}
