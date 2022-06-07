import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ShaclService } from '../../common/services/shacl.service'
import { ParticipantSelfDescriptionDto, SignedParticipantSelfDescriptionDto, WrappedParticipantSelfDescriptionDto } from '../dto/participant-sd.dto'
import { ParticipantContentValidationService } from './content-validation.service'
import { SignatureService } from '../../common/services/signature.service'
import { ValidationResultDto } from '../../common/dto/validation-result.dto'
import { VerifyParticipantRawDto } from '../dto/verify-participant-raw.dto'
import { ParticipantSDParserPipe } from '../pipes/participant-sd-parser.pipe'
import DatasetExt from 'rdf-ext/lib/Dataset'

@Injectable()
export class ParticipantService {
  static readonly SHAPE_PATH = '/shapes/v1/participant.ttl'

  constructor(
    private readonly shaclService: ShaclService,
    private readonly contentService: ParticipantContentValidationService,
    private readonly signatureService: SignatureService
  ) { }

  public async validate(signedSelfDescription: SignedParticipantSelfDescriptionDto): Promise<ValidationResultDto> {
    const { selfDescription, raw, credentialSubject } = signedSelfDescription

    try {
      const selfDescriptionDataset = await this.shaclService.loadFromJsonLD(raw)
      const shape = await this.shaclService.validate(await this.getShaclShape(), selfDescriptionDataset)
      const content = await this.contentService.validate(selfDescription)

      const isValidSignature = false // TODO check against registry
      const isValidCredentialSubject = await this.checkCredentialSubject(credentialSubject, JSON.parse(raw))

      const conforms = shape.conforms && content.conforms && isValidSignature && isValidCredentialSubject

      return {
        conforms,
        shape,
        content,
        isValidSignature,
        isValidCredentialSubject
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException()
    }
  }

  //TODO: Extract to function and refactor validate() and validateSelfDescription()
  public async validateSelfDescription(participantSelfDescription: ParticipantSelfDescriptionDto): Promise<any> {
    const participantSDParserPipe = new ParticipantSDParserPipe()

    //TODO: Create SignatureParserPipe and remove the proof related logic from ParticipantSDParserPipe
    const VerifyParticipant: VerifyParticipantRawDto = {
      selfDescription: participantSelfDescription,
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

  private async checkCredentialSubject(credentialSubject, selfDescription): Promise<boolean> {
    try {
      const canonizedSd = await this.signatureService.canonize(selfDescription)
      const hash = this.signatureService.hashValue(canonizedSd)

      const verifyResult = await this.signatureService.verify(credentialSubject?.jws, credentialSubject?.spkiPem)
      const isValidCredentialSubject = hash === credentialSubject?.sdHash && hash === verifyResult?.content

      return isValidCredentialSubject
    } catch (error) {
      return false
    }
  }

  public async createCredentialSubject(participantSelfDescription) {
    const canonizedSd = await this.signatureService.canonize(participantSelfDescription)

    const hash = this.signatureService.hashValue(canonizedSd)
    const { jws, spkiPem } = await this.signatureService.sign(hash)

    const credentialSubject = {
      id: participantSelfDescription['@id'],
      hashAlgorithm: 'URDNA2015',
      sdHash: hash,
      type: 'JsonWebKey2020',
      jws,
      spkiPem
    }

    return credentialSubject
  }
}
