import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ShaclService } from '../../common/services/shacl.service'
import { SignedParticipantSelfDescriptionDto, WrappedParticipantSelfDescriptionDto } from '../dto/participant-sd.dto'
import { ParticipantContentValidationService } from './content-validation.service'
import { SignatureService } from '../../common/services/signature.service'
import { ValidationResultDto } from '../../common/dto/validation-result.dto'
import { VerifyParticipantRawDto } from '../dto/verify-participant-raw.dto'
import { HttpService } from '@nestjs/axios'
import { ParticipantSDParserPipe } from '../pipes/participant-sd-parser.pipe'
import DatasetExt from 'rdf-ext/lib/Dataset'

@Injectable()
export class ParticipantService {
  static readonly SHAPE_PATH = '/shapes/v1/participant.ttl'

  constructor(
    private readonly shaclService: ShaclService,
    private readonly contentService: ParticipantContentValidationService,
    private readonly signatureService: SignatureService,
    private readonly httpService: HttpService
  ) {}

  public async validate(signedSelfDescription: SignedParticipantSelfDescriptionDto): Promise<ValidationResultDto> {
    const { selfDescription, proof, raw } = signedSelfDescription
    const { jws } = proof || {}

    try {
      const selfDescriptionDataset = await this.shaclService.loadFromJsonLD(raw)
      const shape = await this.shaclService.validate(await this.getShaclShape(), selfDescriptionDataset)

      const content = await this.contentService.validate(selfDescription)

      // TODO check if signature matches content
      let isValidSignature = true
      try {
        isValidSignature = jws ? Boolean(await this.signatureService.verify(jws)) : false
      } catch {
        isValidSignature = false
      }

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
  public async validateSelfDescription(participantSelfDescription: WrappedParticipantSelfDescriptionDto): Promise<any> {
    const participantSDParserPipe = new ParticipantSDParserPipe()

    //TODO: Create SignatureParserPipe and remove the proof related logic from ParticipantSDParserPipe
    const VerifyParticipant: VerifyParticipantRawDto = {
      selfDescription: participantSelfDescription.selfDescription,
      proof: { type: '', created: new Date(), proofPurpose: '', jws: '', verifcationMethod: '' }
    }
    const { selfDescription, raw } = participantSDParserPipe.transform(VerifyParticipant)

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
}
