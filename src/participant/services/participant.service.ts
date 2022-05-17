import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ShaclService } from '../../common/services/shacl.service'
import { SignedParticipantSelfDescriptionDto } from '../dto/participant-sd.dto'
import { ParticipantContentValidationService } from './content-validation.service'
import { SignatureService } from '../../common/services/signature.service'
import { ValidationResultDto } from '../../common/dto/validation-result.dto'
import { HttpService } from '@nestjs/axios'

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
      const participantShaclShape = await this.shaclService.loadFromUrl(`${process.env.REGISTRY_URL}${ParticipantService.SHAPE_PATH}`)

      const selfDescriptionDataset = await this.shaclService.loadFromJsonLD(raw)
      const shape = await this.shaclService.validate(participantShaclShape, selfDescriptionDataset)

      const content = await this.contentService.validate(selfDescription)

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
}
