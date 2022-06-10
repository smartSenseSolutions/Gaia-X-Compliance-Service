import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ShaclService } from '../../common/services/shacl.service'
import { SignedParticipantSelfDescriptionDto, SelfDescriptionCredentialDto, VerifiableSelfDescriptionDto } from '../dto/participant-sd.dto'
import { ParticipantContentValidationService } from './content-validation.service'
import { ValidationResultDto } from '../../common/dto/validation-result.dto'
import { ParticipantSDParserPipe } from '../pipes/participant-sd-parser.pipe'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { ProofService } from '../../common/services/proof.service'

@Injectable()
export class ParticipantService {
  static readonly SHAPE_PATH = '/shapes/v1/participant.ttl'

  constructor(
    private readonly shaclService: ShaclService,
    private readonly contentService: ParticipantContentValidationService,
    private readonly proofService: ProofService
  ) { }

  public async validate(signedSelfDescription: SignedParticipantSelfDescriptionDto): Promise<ValidationResultDto> {
    const { selfDescription, raw, complianceCredential, proof } = signedSelfDescription

    try {
      const selfDescriptionDataset = await this.shaclService.loadFromJsonLD(raw)
      const shape = await this.shaclService.validate(await this.getShaclShape(), selfDescriptionDataset)
      const content = await this.contentService.validate(selfDescription)

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
      console.error(error)
      throw new InternalServerErrorException()
    }
  }

  //TODO: Extract to function and refactor validate() and validateSelfDescription()
  public async validateSelfDescription(participantSelfDescription: SelfDescriptionCredentialDto): Promise<any> {
    const participantSDParserPipe = new ParticipantSDParserPipe()

    const verifableSelfDescription: VerifiableSelfDescriptionDto = {
      complianceCredential: { proof: '', credentialSubject: '' },
      selfDescriptionCredential: { selfDescription: participantSelfDescription.selfDescription, proof: participantSelfDescription.proof }
    }
    const { selfDescription, raw } = participantSDParserPipe.transform(verifableSelfDescription)

    try {
      const selfDescriptionDataset = await this.shaclService.loadFromJsonLD(raw)
      const shape = await this.shaclService.validate(await this.getShaclShape(), selfDescriptionDataset)

      const content = await this.contentService.validate(selfDescription)

      const conforms = shape.conforms && content.conforms

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

  public async getShaclShape(): Promise<DatasetExt> {
    return await this.shaclService.loadFromUrl(`${process.env.REGISTRY_URL}${ParticipantService.SHAPE_PATH}`)
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
