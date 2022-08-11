import { Test, TestingModule } from '@nestjs/testing'
import { CommonModule } from '../../common/common.module'
import { Address, ParticipantContentValidationService } from './content-validation.service'
import { ParticipantSelfDescriptionDto } from '../dto/participant-sd.dto'
import { HttpModule } from '@nestjs/axios'

describe('ParticipantContentValidationService', () => {
  let participantContentValidationService: ParticipantContentValidationService

  const expectedErrorResult = expect.objectContaining({
    conforms: false,
    results: expect.arrayContaining([expect.any(String)])
  })

  const expectedValidResult = expect.objectContaining({
    conforms: true
  })

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ParticipantContentValidationService]
    }).compile()

    participantContentValidationService = moduleRef.get<ParticipantContentValidationService>(ParticipantContentValidationService)
  })

  describe(`Content validation`, () => {
    describe.skip(`Check registrationNumber to be a valid ISO 6523 EUID using EU Business registers portal if legalAddress.country is located in EEA`, () => {
      it('returns true for SD with valid registrationNumber', async () => {
        const legalAddress: Address = {
          country: 'USA',
          state: 'CA'
        }
        const registrationNumber = 'DEANY1234NUMBER'

        const checkEEACountryAndRegistrationNumber = await participantContentValidationService.checkEEACountryAndRegistrationNumber(
          legalAddress,
          registrationNumber
        )

        expect(checkEEACountryAndRegistrationNumber).toEqual(expectedValidResult)
      })
      it('returns false and error description for SD with non registered registrationNumber', async () => {
        const legalAddress: Address = {
          country: 'USA',
          state: 'CA'
        }
        const registrationNumber = 'DEANY1234NUMBER'

        const checkEEACountryAndRegistrationNumber = await participantContentValidationService.checkEEACountryAndRegistrationNumber(
          legalAddress,
          registrationNumber
        )

        expect(checkEEACountryAndRegistrationNumber).toEqual(expectedValidResult)
      })
    })

    describe(`Check legalAddress.state to be two-letter state abbreviation if legalAddress.country is located in USA`, () => {
      const legalAddress: Address = {
        country: 'USA',
        state: 'CA'
      }
      const legalAddressFaulty: Address = {
        country: 'USA',
        state: 'California'
      }

      it('returns true for SD with valid legalAddress.state', () => {
        const check = participantContentValidationService.checkUSAAndValidStateAbbreviation(legalAddress)

        expect(check).toEqual(expectedValidResult)
      })
      it('returns false and error description for SD with invalid legalAddress.state', () => {
        const check = participantContentValidationService.checkUSAAndValidStateAbbreviation(legalAddressFaulty)

        expect(check).toEqual(expectedErrorResult)
      })
    })

    describe(`Check gleif.org API for leiCode`, () => {
      const countryMock = {
        country: 'DE'
      }
      const participantMock = {
        legalAddress: countryMock,
        headquarterAddress: countryMock
      }

      it('returns true for a valid LeiCode that exists', async () => {
        const validLeiCode = '391200FJBNU0YW987L26'
        const validationResult = await participantContentValidationService.checkValidLeiCode(
          validLeiCode,
          participantMock as unknown as ParticipantSelfDescriptionDto
        )

        expect(validationResult).toEqual(expectedValidResult)
      })

      it('returns false for an invalid LeiCode that does not exist', async () => {
        const invalidLeiCode = 'FFF'
        const validationResult = await participantContentValidationService.checkValidLeiCode(
          invalidLeiCode,
          participantMock as unknown as ParticipantSelfDescriptionDto
        )
        expect(validationResult).toEqual(expectedErrorResult)
      })

      it('returns true for SD with equal values for leiCode.headquarter.country and headquarterAddress.country', () => {
        const headquarterCountry = 'DEU'
        const headquarterAddresCountry = 'DEU'
        expect(participantContentValidationService.checkValidLeiCountry(headquarterCountry, headquarterAddresCountry, 'headquarterAddress')).toEqual(
          expectedValidResult
        )
      })

      it('returns false and error description for SD with different values for leiCode.headquarter.country and headquarterAddress.country', () => {
        const headquarterCountry = 'DEU'
        const headquarterAddresCountry = 'IT'
        expect(participantContentValidationService.checkValidLeiCountry(headquarterCountry, headquarterAddresCountry, 'headquarterAddress')).toEqual(
          expectedErrorResult
        )
      })

      it('returns true for SD with equal values leiCode.legal.country and legalAddress.country', () => {
        const legalCountry = 'DEU'
        const legalAddressCountry = 'DEU'
        expect(participantContentValidationService.checkValidLeiCountry(legalCountry, legalAddressCountry, 'legalAddress')).toEqual(
          expectedValidResult
        )
      })

      it('returns false and error description for SD with different values for leiCode.legal.country and legalAddress.country', () => {
        const legalCountry = 'DEU'
        const legalAddressCountry = 'IT'
        expect(participantContentValidationService.checkValidLeiCountry(legalCountry, legalAddressCountry, 'legalAddress')).toEqual(
          expectedErrorResult
        )
      })
    })
  })
})
