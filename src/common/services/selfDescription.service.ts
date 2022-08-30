import { BadRequestException, Injectable, ConflictException, HttpStatus, Logger } from '@nestjs/common'
import { SDParserPipe } from '../pipes/sd-parser.pipe'
import { HttpService } from '@nestjs/axios'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { ProofService } from './proof.service'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto/service-offering-sd.dto'
import { ShaclService } from './shacl.service'
import {
  CredentialSubjectDto,
  SignatureDto,
  SignedSelfDescriptionDto,
  ValidationResult,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto
} from '../dto'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { setSelfDescriptionContext } from '../utils'
import { SelfDescriptionTypes } from '../enums'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../constants'
import { ValidationResulWithoutContent } from '../@types'

@Injectable()
export class SelfDescriptionService {
  static readonly SHAPE_PATHS = {
    PARTICIPANT: '/api/v2206/shape/files?file=participant&type=ttl',
    SERVICE_OFFERING: '/api/v2206/shape/files?file=service-offering&type=ttl'
  }
  private readonly logger = new Logger(SelfDescriptionService.name)

  constructor(private readonly httpService: HttpService, private readonly shaclService: ShaclService, private readonly proofService: ProofService) {}

  public async validate(signedSelfDescription: SignedSelfDescriptionDto<CredentialSubjectDto>): Promise<ValidationResulWithoutContent> {
    const { selfDescriptionCredential: selfDescription, raw, complianceCredential, proof } = signedSelfDescription

    const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
    const shapePath: string = this.getShapePath(type)
    if (!shapePath) throw new BadRequestException('Provided Type does not exist for Self Descriptions')

    const expectedContexts = {
      [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE,
      [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE
    }

    if (!(type in expectedContexts)) throw new ConflictException('Provided Type is not supported')

    const rawPrepared = {
      ...JSON.parse(raw),
      ...expectedContexts[type]
    }
    const selfDescriptionDataset: DatasetExt = await this.shaclService.loadFromJsonLD(JSON.stringify(rawPrepared))

    const shape: ValidationResult = await this.shaclService.validate(await this.getShaclShape(shapePath), selfDescriptionDataset)
    // const content: ValidationResult = await this.validateContent(selfDescription, type)

    const parsedRaw = JSON.parse(raw)
    const fixedRaw = setSelfDescriptionContext(parsedRaw)

    const isValidSignature: boolean = await this.checkParticipantCredential(
      { selfDescription: fixedRaw, proof: complianceCredential?.proof },
      proof?.jws
    )

    const conforms: boolean = shape.conforms && isValidSignature // && content.conforms

    return {
      conforms,
      shape,
      // content,
      isValidSignature
    }
  }

  //TODO: Could be potentially merged with validate()
  public async validateSelfDescription(
    participantSelfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>,
    sdType: string
  ): Promise<ValidationResulWithoutContent> {
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

    const { selfDescriptionCredential: selfDescription, raw } = _SDParserPipe.transform(verifableSelfDescription)

    try {
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential') // selfDescription.type

      const rawPrepared: any = {
        ...JSON.parse(raw),
        ...(type === 'LegalPerson' ? EXPECTED_PARTICIPANT_CONTEXT_TYPE : EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE)
      }

      const selfDescriptionDataset: DatasetExt = await this.shaclService.loadFromJsonLD(JSON.stringify(rawPrepared))

      const shapePath: string = this.getShapePath(type)
      const shape: ValidationResult = await this.shaclService.validate(await this.getShaclShape(shapePath), selfDescriptionDataset)

      // const content: ValidationResult = await this.validateContent(selfDescription, type)

      const conforms: boolean = shape.conforms // && content.conforms

      const result = {
        conforms,
        //content,
        shape
      }

      if (!conforms) throw new ConflictException(result)

      return result
    } catch (error) {
      if (error.status === 409) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: error.response,
          error: 'Conflict'
        })
      }
      this.logger.error(error.message)
      throw new BadRequestException('Provided Self Description cannot be validated.')
    }
  }

  public async getShaclShape(shapePath: string): Promise<DatasetExt> {
    return await this.shaclService.loadFromUrl(`${process.env.REGISTRY_URL || 'https://registry.gaia-x.eu'}${shapePath}`)
  }

  // private async validateContent(selfDescription, type): Promise<ValidationResult> {
  //   const validationFns: { [key: string]: () => Promise<ValidationResult> } = {
  //     [SelfDescriptionTypes.PARTICIPANT]: async () => {
  //       return await this.participantContentValidationService.validate(selfDescription)
  //     },
  //     [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
  //       const result: ValidationResulWithoutContent = await this.validateProvidedByParticipantSelfDescriptions(selfDescription.providedBy)
  //       return await this.serviceOfferingContentValidationService.validate(selfDescription as ServiceOfferingSelfDescriptionDto, result)
  //     }
  //   }

  //   return (await validationFns[type]()) || undefined
  // }

  private async validateProvidedByParticipantSelfDescriptions(
    providedBy: ServiceOfferingSelfDescriptionDto['providedBy']
  ): Promise<ValidationResulWithoutContent> {
    const response = await this.httpService.get(providedBy).toPromise()
    const { data } = response

    const participantSD = new SDParserPipe(SelfDescriptionTypes.PARTICIPANT).transform(data)
    return await this.validate(participantSD)
  }

  private getShapePath(type: string): string | undefined {
    const shapePathType = {
      [SelfDescriptionTypes.PARTICIPANT]: 'PARTICIPANT',
      [SelfDescriptionTypes.SERVICE_OFFERING]: 'SERVICE_OFFERING'
    }

    return SelfDescriptionService.SHAPE_PATHS[shapePathType[type]] || undefined
  }

  private async checkParticipantCredential(selfDescription, jws: string): Promise<boolean> {
    try {
      const result: boolean = await this.proofService.validate(selfDescription, true, jws)
      return result
    } catch (error) {
      this.logger.error(error)
      return false
    }
  }
}
