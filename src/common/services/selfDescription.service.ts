import { BadRequestException, Injectable, ConflictException, HttpStatus, Logger } from '@nestjs/common'
import { SDParserPipe } from '../pipes/sd-parser.pipe'
import { HttpService } from '@nestjs/axios'
import { ParticipantContentValidationService } from '../../participant/services/content-validation.service'
import { ParticipantSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import { ProofService } from '../../common/services/proof.service'
import { ServiceOfferingContentValidationService } from '../../service-offering/services/content-validation.service'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto/service-offering-sd.dto'
import { ShaclService } from '../../common/services/shacl.service'
import { SignatureDto } from '../dto/signature.dto'
import { SignedSelfDescriptionDto } from '../dto/self-description.dto'
import { ValidationResultDto, ValidationResult } from '../../common/dto/validation-result.dto'
import { VerifiableCredentialDto } from '../dto/credential-meta.dto'
import { VerifiableSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { setSelfDescriptionContext } from '../utils'
import { SelfDescriptionTypes } from '../enums'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../constants'
@Injectable()
export class SelfDescriptionService {
  static readonly SHAPE_PATHS = {
    PARTICIPANT: '/shapes/v1/participant.ttl',
    SERVICE_OFFERING: '/shapes/v1/service-offering.ttl'
  }
  static readonly SHAPE_PATH_PARTICIPANT = '/shapes/v1/participant.ttl'
  private readonly logger = new Logger(SelfDescriptionService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly shaclService: ShaclService,
    private readonly participantContentService: ParticipantContentValidationService,
    private readonly serviceOfferingContentValidationService: ServiceOfferingContentValidationService,
    private readonly proofService: ProofService
  ) {}

  public async validate(signedSelfDescription: SignedSelfDescriptionDto, isComplianceCredentialCheck?: boolean): Promise<ValidationResultDto> {
    const { selfDescriptionCredential: selfDescription, raw, complianceCredential, proof } = signedSelfDescription

    const type: string = selfDescription['@type'].find(t => t !== 'VerifiableCredential')
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
    const content: ValidationResult = await this.validateContent(selfDescription, type)

    const parsedRaw = JSON.parse(raw)
    const fixedRaw = setSelfDescriptionContext(parsedRaw)

    const isValidSignature: boolean = await this.checkParticipantCredential(
      { selfDescription: fixedRaw, proof: complianceCredential?.proof },
      proof?.jws
    )

    const conforms: boolean = shape.conforms && content.conforms && isValidSignature

    return {
      conforms,
      shape,
      content,
      isValidSignature
    }
  }

  //TODO: Could be potentially merged with validate()
  public async validateSelfDescription(
    participantSelfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>,
    sdType: string
  ): Promise<ValidationResultDto> {
    const _SDParserPipe = new SDParserPipe(sdType)

    const verifableSelfDescription: VerifiableSelfDescriptionDto = {
      complianceCredential: {
        proof: {} as SignatureDto,
        credentialSubject: { id: '', hash: '' },
        '@context': [],
        '@type': [],
        id: '',
        issuer: '',
        issuanceDate: new Date().toISOString()
      },
      selfDescriptionCredential: participantSelfDescription
    }

    const { selfDescriptionCredential: selfDescription, raw } = _SDParserPipe.transform(verifableSelfDescription)

    try {
      const type: string = selfDescription['@type'].find(t => t !== 'VerifiableCredential') // selfDescription['@type'] //

      const rawPrepared: any = {
        ...JSON.parse(raw),
        ...(type === 'LegalPerson' ? EXPECTED_PARTICIPANT_CONTEXT_TYPE : EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE)
      }

      const selfDescriptionDataset: DatasetExt = await this.shaclService.loadFromJsonLD(JSON.stringify(rawPrepared))

      const shapePath: string = this.getShapePath(type)
      const shape: ValidationResult = await this.shaclService.validate(await this.getShaclShape(shapePath), selfDescriptionDataset)

      const content: ValidationResult = await this.validateContent(selfDescription, type)

      const conforms: boolean = shape.conforms && content.conforms

      const result = {
        conforms,
        shape,
        content
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
    return await this.shaclService.loadFromUrl(`${process.env.REGISTRY_URL}${shapePath}`)
  }

  private async validateContent(selfDescription, type): Promise<ValidationResult> {
    const validationFns: { [key: string]: () => Promise<ValidationResult> } = {
      [SelfDescriptionTypes.PARTICIPANT]: async () => {
        return await this.participantContentService.validate(selfDescription)
      },
      [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
        const result: ValidationResultDto = await this.validateProvidedByParticipantSelfDescriptions(selfDescription.providedBy)
        return await this.serviceOfferingContentValidationService.validate(selfDescription as ServiceOfferingSelfDescriptionDto, result)
      }
    }

    return (await validationFns[type]()) || undefined
  }

  private async validateProvidedByParticipantSelfDescriptions(
    providedBy: ServiceOfferingSelfDescriptionDto['providedBy']
  ): Promise<ValidationResultDto> {
    const response = await this.httpService.get(providedBy).toPromise()
    const { data } = response

    const participantSD = new SDParserPipe(SelfDescriptionTypes.PARTICIPANT).transform(data)
    return await this.validate(participantSD as SignedSelfDescriptionDto, false)
  }

  private getShapePath(type: string): string | undefined {
    const shapePaths = {
      [SelfDescriptionTypes.PARTICIPANT]: SelfDescriptionService.SHAPE_PATHS.PARTICIPANT,
      [SelfDescriptionTypes.SERVICE_OFFERING]: SelfDescriptionService.SHAPE_PATHS.SERVICE_OFFERING
    }

    return shapePaths[type] || undefined
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
