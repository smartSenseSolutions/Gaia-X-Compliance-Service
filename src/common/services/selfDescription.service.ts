import { BadRequestException, ConflictException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { SDParserPipe } from '../pipes'
import { HttpService } from '@nestjs/axios'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { ProofService } from './proof.service'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto'
import { ParticipantContentValidationService } from '../../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from '../../service-offering/services/content-validation.service'
import { ShaclService } from './shacl.service'
import {
  CredentialSubjectDto,
  SignatureDto,
  SignedSelfDescriptionDto,
  ValidationResult,
  ValidationResultDto,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto
} from '../dto'

import { SelfDescriptionTypes } from '../enums'
import { validationResultWithoutContent } from '../@types'
import { RegistryService } from './registry.service'
import { getTypeFromSelfDescription } from '../utils'

@Injectable()
export class SelfDescriptionService {
  private readonly logger = new Logger(SelfDescriptionService.name)

  constructor(private readonly httpService: HttpService, private readonly shaclService: ShaclService, private readonly proofService: ProofService) {}

  public async verify(signedSelfDescription: any): Promise<ValidationResultDto> {
    try {
      const participantContentValidationService = new ParticipantContentValidationService(this.httpService, new RegistryService(this.httpService))
      const serviceOfferingContentValidationService = new ServiceOfferingContentValidationService(this.proofService, this.httpService)
      const { selfDescriptionCredential: selfDescription, raw, rawCredentialSubject, complianceCredential, proof } = signedSelfDescription
      const type: string = getTypeFromSelfDescription(signedSelfDescription.selfDescriptionCredential)
      const shape: ValidationResult = await this.shaclService.verifyShape(rawCredentialSubject, type)
      const parsedRaw = JSON.parse(raw)
      const isValidSignature: boolean = await this.checkParticipantCredential(
        { selfDescription: parsedRaw, proof: complianceCredential?.proof },
        proof?.jws,
        complianceCredential
      )
      //const isValidSignature = true //test-purpose
      const validationFns: { [key: string]: () => Promise<ValidationResultDto> } = {
        [SelfDescriptionTypes.PARTICIPANT]: async () => {
          const content: ValidationResult = await participantContentValidationService.validate(
            selfDescription.credentialSubject as ParticipantSelfDescriptionDto
          )
          const conforms: boolean = shape.conforms && isValidSignature && content.conforms

          return { conforms, isValidSignature, content, shape }
        },
        [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
          const participantSDFromProvidedBy = await this.retrieveProviderSD(selfDescription)
          const participantVerification = await this.verify(participantSDFromProvidedBy)
          const content = await serviceOfferingContentValidationService.validate(
            signedSelfDescription as SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
            participantSDFromProvidedBy as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
            participantVerification
          )
          const conforms: boolean = shape.conforms && isValidSignature && content.conforms
          return { conforms, isValidSignature, content, shape }
        }
      }
      return (await validationFns[type]()) || undefined
    } catch (e) {
      throw e
    }
  }

  private async retrieveProviderSD(selfDescription) {
    return await new Promise(async (resolve, reject) => {
      try {
        const response = await this.httpService.get(selfDescription.credentialSubject.providedBy).toPromise()
        const { data } = response
        const participantSD = new SDParserPipe(SelfDescriptionTypes.PARTICIPANT).transform(data)
        resolve(participantSD as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>)
      } catch (e) {
        reject(new ConflictException('Participant SD not found'))
      }
    })
  }

  //TODO: Could be potentially merged with validate()
  public async validateSelfDescription(
    participantSelfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>,
    sdType: string
  ): Promise<validationResultWithoutContent> {
    const _SDParserPipe = new SDParserPipe(sdType)

    const verifableSelfDescription: VerifiableSelfDescriptionDto<CredentialSubjectDto> = {
      complianceCredential: {
        proof: {} as SignatureDto,
        credentialSubject: { id: '', hash: '', type: '' },
        '@context': [],
        type: [],
        id: '',
        issuer: '',
        issuanceDate: new Date().toISOString()
      },
      selfDescriptionCredential: { ...participantSelfDescription }
    }

    const { selfDescriptionCredential: selfDescription, rawCredentialSubject } = _SDParserPipe.transform(verifableSelfDescription)

    try {
      const type: string = getTypeFromSelfDescription(selfDescription)
      const shape: ValidationResult = await this.shaclService.verifyShape(rawCredentialSubject, type)
      const conforms: boolean = shape.conforms

      const result = {
        conforms,
        shape
      }

      if (!conforms) throw new ConflictException(result)

      return result
    } catch (error) {
      this.logger.error(error)
      if (error instanceof ConflictException) {
        throw error
      }
      if (error.status === 409) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: error.response,
          error: 'Conflict'
        })
      }
      throw new BadRequestException('Provided Self Description cannot be validated.')
    }
  }

  public async verify_v2(signedSelfDescription: any): Promise<ValidationResultDto> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { selfDescriptionCredential: selfDescription, raw, rawCredentialSubject, complianceCredential, proof } = signedSelfDescription
      const type: string = getTypeFromSelfDescription(selfDescription)
      const parsedRaw = JSON.parse(raw)
      const isValidSignature: boolean = await this.checkParticipantCredential(
        { selfDescription: parsedRaw, proof: complianceCredential?.proof },
        proof?.jws,
        complianceCredential
      )
      const validationFns: { [key: string]: () => Promise<ValidationResultDto> } = {
        [SelfDescriptionTypes.PARTICIPANT]: async () => {
          const conforms: boolean = isValidSignature

          return { conforms, isValidSignature }
        },
        [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
          const participantSDFromProvidedBy = await this.retrieveProviderSD(selfDescription)
          const participantVerification = await this.verify(participantSDFromProvidedBy)
          const conforms: boolean = isValidSignature && participantVerification.conforms
          return { conforms, isValidSignature }
        }
      }
      return (await validationFns[type]()) || undefined
    } catch (e) {
      throw e
    }
  }

  public async validate(signedSelfDescription: any): Promise<ValidationResultDto> {
    try {
      const participantContentValidationService = new ParticipantContentValidationService(this.httpService, new RegistryService(this.httpService))
      const serviceOfferingContentValidationService = new ServiceOfferingContentValidationService(this.proofService, this.httpService)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { selfDescriptionCredential: selfDescription, raw, rawCredentialSubject, complianceCredential, proof } = signedSelfDescription
      const type: string = getTypeFromSelfDescription(selfDescription)
      const shape: ValidationResult = await this.shaclService.verifyShape(rawCredentialSubject, type)
      const validationFns: { [key: string]: () => Promise<ValidationResultDto> } = {
        [SelfDescriptionTypes.PARTICIPANT]: async () => {
          const content: ValidationResult = await participantContentValidationService.validate(
            selfDescription.credentialSubject as ParticipantSelfDescriptionDto
          )
          const conforms: boolean = shape.conforms && content.conforms

          return { conforms, content, shape }
        },
        [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
          const participantSDFromProvidedBy = await this.retrieveProviderSD(selfDescription)
          const participantVerification = await this.verify_v2(participantSDFromProvidedBy)
          const content = await serviceOfferingContentValidationService.validate(
            signedSelfDescription as SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
            participantSDFromProvidedBy as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
            participantVerification
          )
          const conforms: boolean = shape.conforms && content.conforms
          return { conforms, content, shape }
        }
      }
      return (await validationFns[type]()) || undefined
    } catch (e) {
      throw e
    }
  }

  private async checkParticipantCredential(selfDescription, jws: string, complianceCredential): Promise<boolean> {
    try {
      let notAltered = await this.proofService.checkIfFalsified(selfDescription.selfDescription,jws,complianceCredential)
      let validationCheck = await this.proofService.validate(complianceCredential, true, jws, true)
      this.logger.log(`Signature validation test has returned ${validationCheck}`)
      this.logger.log(`SelfDescription hash comparison test has returned ${notAltered}`)
      return notAltered && validationCheck
    } catch (error) {
      this.logger.error(error)
      return false
    }
  }
}
