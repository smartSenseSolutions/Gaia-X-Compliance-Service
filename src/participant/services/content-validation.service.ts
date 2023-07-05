import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { AddressDto, ValidationResult } from '../../common/dto'
import countryCodes from '../../static/validation/iso-3166-2-country-codes.json'
import { ParticipantSelfDescriptionDto } from '../dto'
import { webResolver } from '../../common/utils'

function mergeResults(...results: ValidationResult[]): ValidationResult {
  const resultArray = results.map(res => res.results)
  const res = resultArray.reduce((p, c) => c.concat(p))

  return {
    conforms: results.filter(r => !r.conforms).length == 0,
    results: res
  }
}

function getParticipantFieldByAtomicName(sd: ParticipantSelfDescriptionDto, fieldName: string): any {
  return sd[`gx:${fieldName}`] ? sd[`gx:${fieldName}`] : sd[fieldName]
}

@Injectable()
export class ParticipantContentValidationService {
  constructor(private readonly httpService: HttpService) {}

  async validate(data: ParticipantSelfDescriptionDto): Promise<ValidationResult> {
    const checkUSAAndValidStateAbbreviation = this.checkUSAAndValidStateAbbreviation(getParticipantFieldByAtomicName(data, 'legalAddress'))

    const validationPromises: Promise<ValidationResult>[] = []
    // TODO Implement registration issuer validation
    validationPromises.push(this.CPR08_CheckDid(data))
    const results = await Promise.all(validationPromises)

    return mergeResults(...results, checkUSAAndValidStateAbbreviation)
  }

  //CountryCode verification
  checkUSAAndValidStateAbbreviation(legalAddress: AddressDto): ValidationResult {
    let conforms = true
    const results = []

    if (!legalAddress) {
      conforms = false
      results.push('legalAddress is not present')
      return {
        conforms,
        results
      }
    }

    const country = this.getISO31662Country(
      legalAddress['gx:countrySubdivisionCode'] ? legalAddress['gx:countrySubdivisionCode'] : legalAddress['countrySubdivisionCode']
    )

    if (!country) {
      conforms = false
      results.push('legalAddress.code: needs to be a valid ISO-3166-2 country principal subdivision code')
    }

    return {
      conforms,
      results
    }
  }

  private getISO31662Country(code: string) {
    if (!code) {
      return false
    }
    return countryCodes.find(c => {
      return c === code
    })
  }

  // DID verification
  async CPR08_CheckDid(jsonLd): Promise<ValidationResult> {
    const invalidUrls = await this.checkDidUrls(this.parseDid(jsonLd))
    const isValid = invalidUrls.length == 0
    return {
      conforms: isValid,
      results: invalidUrls && invalidUrls.length > 0 ? [`At least one did was not resolvable ${JSON.stringify(invalidUrls)}`] : []
    }
  }

  async checkDidUrls(DIDsArray, invalidUrls = []) {
    await Promise.all(
      DIDsArray.map(async element => {
        try {
          const url = webResolver(element)
          await this.httpService.get(url, { timeout: 1500 }).toPromise()
        } catch (e) {
          invalidUrls.push(element)
        }
      })
    )
    return invalidUrls
  }

  parseDid(jsonLD, tab = []) {
    const values = this.parseJSONLD(jsonLD)
    for (const item of values) {
      if (item.startsWith('did:web:')) {
        tab.push(item)
      }
    }
    return tab.filter((item, index) => tab.indexOf(item) === index)
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
}
