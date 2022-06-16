import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { ShaclService } from '../../common/services/shacl.service'
import { ParticipantContentValidationService } from '../../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from '../../service-offering/services/content-validation.service'
import { ValidationResultDto, ValidationResult } from '../../common/dto/validation-result.dto'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { ProofService } from '../../common/services/proof.service'
import { SignedSelfDescriptionDto } from '../dto/self-description.dto'
import { ParticipantSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import { SDParserPipe } from '../pipes/sd-parser.pipe'
import { VerifiableSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import { ServiceOfferingSelfDescriptionDto } from 'src/service-offering/dto/service-offering-sd.dto'
import { HttpService } from '@nestjs/axios'
import { SignatureDto } from '../dto/signature.dto'
import { VerifiableCredentialDto } from '../dto/credential-meta.dto'
@Injectable()
export class SelfDescriptionService {
  static readonly SHAPE_PATHS = {
    PARTICIPANT: '/shapes/v1/participant.ttl',
    SERVICE_OFFERING: '/shapes/v1/service-offering.ttl'
  }
  // TODO extract to common types
  static readonly TYPES = {
    PARTICIPANT: 'gx-participant:LegalPerson',
    SERVICE_OFFERING: 'gx-service-offering-experimental:ServiceOfferingExperimental'
  }
  static readonly SHAPE_PATH_PARTICIPANT = '/shapes/v1/participant.ttl'

  constructor(
    private readonly httpService: HttpService,
    private readonly shaclService: ShaclService,
    private readonly participantContentService: ParticipantContentValidationService,
    private readonly serviceOfferingContentValidationService: ServiceOfferingContentValidationService,
    private readonly proofService: ProofService
  ) { }

  public async validate(signedSelfDescription: SignedSelfDescriptionDto, isComplianceCredentialCheck?: boolean): Promise<ValidationResultDto> {
    const { selfDescriptionCredential: selfDescription, raw, complianceCredential, proof } = signedSelfDescription
    try {
      const type = Array.isArray(selfDescription['@type'])
        ? selfDescription['@type'].find(t => t !== 'VerifiableCredential')
        : selfDescription['@type']

      const shapePath = this.getShapePath(type)
      if (!shapePath) {
        throw new BadRequestException('Provided Type does not exist for Self Descriptions')
      }

      const selfDescriptionDataset = await this.shaclService.loadFromJsonLD(raw)

      if (isComplianceCredentialCheck) {
        const isValidComplianceCredential = this.checkComplianceCredential(complianceCredential)
        if (!isValidComplianceCredential) throw new BadRequestException('Invalid Compliance Credential. Missing Fields')
      }

      const shape = await this.shaclService.validate(await this.getShaclShape(shapePath), selfDescriptionDataset)
      const content: ValidationResult = await this.validateContent(selfDescription, type)

      const isValidSignature = await this.checkParticipantCredential(
        { selfDescription: JSON.parse(raw), proof: complianceCredential.proof },
        proof.jws
      )
      const conforms = shape.conforms && content.conforms && isValidSignature

      return {
        conforms,
        shape,
        content,
        isValidSignature
      }
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }

  //TODO: Could be potentially merged with validate()
  public async validateSelfDescription(
    participantSelfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
  ): Promise<ValidationResultDto> {
    const _SDParserPipe = new SDParserPipe()

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
      const selfDescriptionDataset = await this.shaclService.loadFromJsonLD(raw)
      const type: string = selfDescription['@type'] // selfDescription['@type'].find(t => t !== 'VerifiableCredential')

      const shapePath = this.getShapePath(type)

      const shape = await this.shaclService.validate(await this.getShaclShape(shapePath), selfDescriptionDataset)

      const content = await this.validateContent(selfDescription, type)

      const conforms = shape.conforms && content.conforms

      //TODO: adjust return type or returned values (Omit<ValidationResultDto>)
      return {
        conforms,
        shape,
        content
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException()
    }
  }

  public async getShaclShape(shapePath: string): Promise<DatasetExt> {
    return await this.shaclService.loadFromUrl(`${process.env.REGISTRY_URL}${shapePath}`)
  }

  // TODO complete checks
  private checkComplianceCredential(complianceCredential): boolean {
    try {
      if (complianceCredential['@context'][0] !== 'https://www.w3.org/2018/credentials/v1') return false
      if (!complianceCredential['@type']) return false
      if (!complianceCredential['id']) return false
      if (!complianceCredential['issuanceDate']) return false
      if (!complianceCredential['credentialSubject']) return false
      if (!complianceCredential['proof']) return false

      return true
    } catch (error) {
      return false
    }
  }

  private async validateContent(selfDescription, type): Promise<ValidationResult> {
    let content = undefined

    if (type === SelfDescriptionService.TYPES.PARTICIPANT) {
      content = await this.participantContentService.validate(selfDescription)
    } else {
      const result: ValidationResultDto = await this.validateProvidedByParticipantSelfDescriptions(
        (selfDescription as ServiceOfferingSelfDescriptionDto)['gx-service-offering:providedBy']
      )

      content = await this.serviceOfferingContentValidationService.validate(selfDescription as ServiceOfferingSelfDescriptionDto, result)
    }

    return content
  }

  private async validateProvidedByParticipantSelfDescriptions(
    providedBy: ServiceOfferingSelfDescriptionDto['providedBy']
  ): Promise<ValidationResultDto> {
    const response = await this.httpService.get(providedBy).toPromise()
    const { data } = response

    const participantSD = new SDParserPipe().transform(data)
    return await this.validate(participantSD as SignedSelfDescriptionDto, false)
  }

  private getShapePath(type: string): string {
    switch (type) {
      case SelfDescriptionService.TYPES.PARTICIPANT:
        return SelfDescriptionService.SHAPE_PATHS.PARTICIPANT
      case SelfDescriptionService.TYPES.SERVICE_OFFERING:
        return SelfDescriptionService.SHAPE_PATHS.SERVICE_OFFERING
    }

    return undefined
  }

  private async checkParticipantCredential(selfDescription, jws: string): Promise<boolean> {
    try {
      const result = await this.proofService.verify(selfDescription, true, jws)
      return result
    } catch (error) {
      return false
    }
  }
}
