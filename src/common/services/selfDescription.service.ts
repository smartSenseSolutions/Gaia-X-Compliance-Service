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

@Injectable()
export class SelfDescriptionService {
  private readonly logger = new Logger(SelfDescriptionService.name)

  constructor(private readonly httpService: HttpService, private readonly shaclService: ShaclService, private readonly proofService: ProofService) {}

  participantContentValidationService = new ParticipantContentValidationService(this.httpService, new RegistryService(this.httpService))
  serviceOfferingContentValidationService = new ServiceOfferingContentValidationService(this.proofService, this.httpService)

  public async verify(signedSelfDescription: any): Promise<ValidationResultDto> {
    try {
      const { selfDescriptionCredential: selfDescription, raw, rawCredentialSubject, complianceCredential, proof } = signedSelfDescription
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
      const shape: ValidationResult = await this.shaclService.verifyShape(rawCredentialSubject, type)
      const parsedRaw = JSON.parse(raw)
      const isValidSignature: boolean = await this.checkParticipantCredential(
        { selfDescription: parsedRaw, proof: complianceCredential?.proof },
        proof?.jws
      )
      const validationFns: { [key: string]: () => Promise<ValidationResultDto> } = {
        [SelfDescriptionTypes.PARTICIPANT]: async () => {
          const content: ValidationResult = await this.participantContentValidationService.validate(
            selfDescription.credentialSubject as ParticipantSelfDescriptionDto
          )
          const conforms: boolean = shape.conforms && isValidSignature && content.conforms

          return { conforms, isValidSignature, content, shape }
        },
        [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
          const participantSDFromProvidedBy = await this.retrieveProviderSD(selfDescription)
          const participantVerification = await this.verify(participantSDFromProvidedBy)
          const content = await this.serviceOfferingContentValidationService.validate(
            signedSelfDescription as VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto>
          )
          const conforms: boolean = shape.conforms && isValidSignature && content.conforms && participantVerification.conforms
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
        credentialSubject: { id: '', hash: '' },
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
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential') // selfDescription.type
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
      const { selfDescriptionCredential: selfDescription, raw, complianceCredential, proof } = signedSelfDescription
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
      const parsedRaw = JSON.parse(raw)
      const isValidSignature: boolean = await this.checkParticipantCredential(
        { selfDescription: parsedRaw, proof: complianceCredential?.proof },
        proof?.jws
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
      const { selfDescriptionCredential: selfDescription, rawCredentialSubject } = signedSelfDescription
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
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
            signedSelfDescription as VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto>
          )
          const conforms: boolean = shape.conforms && content.conforms && participantVerification.conforms
          return { conforms, content, shape }
        }
      }
      return (await validationFns[type]()) || undefined
    } catch (e) {
      throw e
    }
  }

  public async validate_experimental(vcs: VerifiableCredentialDto<CredentialSubjectDto>[]): Promise<ValidationResultDto> {
    try {
      const result: ValidationResultDto[] = []
      for (let i = 0; i < vcs.length; i++) {
        const type: string = vcs[i].type.find(t => t !== 'VerifiableCredential')
        const contentChecks = await this.validationFns[type](vcs[i], type)
        const isValidSignature = await this.proofService.validate(JSON.parse(JSON.stringify(vcs[i])))
        contentChecks.isValidSignature = isValidSignature
        const conforms: boolean = contentChecks.conforms && isValidSignature
        contentChecks.conforms = conforms
        result.push(contentChecks)
      }
      return this.mergeResults(result)
    } catch (e) {
      this.logger.error(e)
      throw e
    }
  }

  private async checkParticipantCredential(selfDescription, jws: string): Promise<boolean> {
    try {
      return await this.proofService.validate(selfDescription, true, jws)
    } catch (error) {
      this.logger.error(error)
      return false
    }
  }

  private validationFns: { [key: string]: (vc, type) => Promise<ValidationResultDto> } = {
    [SelfDescriptionTypes.PARTICIPANT]: async (vc, type) => {
      const _SDParserPipe = new SDParserPipe(type)
      const verifiableSelfDescription_compliance: VerifiableSelfDescriptionDto<CredentialSubjectDto> = {
        selfDescriptionCredential: { ...vc }
      }
      const { selfDescriptionCredential: selfDescription, rawCredentialSubject } = _SDParserPipe.transform(verifiableSelfDescription_compliance)
      const shape: ValidationResult = await this.shaclService.verifyShape(rawCredentialSubject, type)
      const content: ValidationResult = await this.participantContentValidationService.validate(
        selfDescription.credentialSubject as ParticipantSelfDescriptionDto
      )
      const conforms: boolean = shape.conforms && content.conforms

      return { conforms, content, shape }
    },
    [SelfDescriptionTypes.SERVICE_OFFERING]: async (vc, type) => {
      const _SDParserPipe = new SDParserPipe(type)
      const verifiableSelfDescription_compliance: VerifiableSelfDescriptionDto<CredentialSubjectDto> = {
        selfDescriptionCredential: { ...vc }
      }
      const { selfDescriptionCredential: selfDescription, rawCredentialSubject } = _SDParserPipe.transform(verifiableSelfDescription_compliance)
      const shape: ValidationResult = await this.shaclService.verifyShape(rawCredentialSubject, type)
      const content = await this.serviceOfferingContentValidationService.validate(
        selfDescription as VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto>
      )
      const conforms: boolean = shape.conforms && content.conforms
      return { conforms, content, shape }
    },
    [SelfDescriptionTypes.TERMS_AND_CONDITION]: async () => {
      return { conforms: true, content: { conforms: true, results: [] }, shape: { conforms: true, results: [] } }
    },
    [SelfDescriptionTypes.REGISTRATION_NUMBER]: async () => {
      return { conforms: true, content: { conforms: true, results: [] }, shape: { conforms: true, results: [] } }
    },
    [SelfDescriptionTypes.PARTICIPANT_CREDENTIAL]: async () => {
      return { conforms: true, content: { conforms: true, results: [] }, shape: { conforms: true, results: [] } }
    }
  }

  private mergeResults(results: ValidationResultDto[]): ValidationResultDto {
    const contentArray = results.map(res => res.content)
    const shapeArray = results.map(res => res.shape)
    const contentConcat = []
    const shapeConcat = []
    contentArray.map(results => contentConcat.push(results.results))
    shapeArray.map(results => shapeConcat.push(results.results))
    const contentres: string[] = contentConcat.reduce((p, c) => c.concat(p))
    const shaperes: string[] = shapeConcat.reduce((p, c) => c.concat(p))

    return {
      conforms: results.filter(r => !r.conforms).length == 0,
      content: {
        conforms: contentArray.filter(r => !r.conforms).length == 0,
        results: contentres
      },
      shape: {
        conforms: shapeArray.filter(r => !r.conforms).length == 0,
        results: shaperes
      },
      isValidSignature: results.filter(r => !r.isValidSignature).length == 0
    }
  }
}
