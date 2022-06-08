import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ShaclService } from '../../common/services/shacl.service'
import { SignedParticipantSelfDescriptionDto, SelfDescriptionCredentialDto, VerifiableSelfDescriptionDto } from '../dto/participant-sd.dto'
import { ParticipantContentValidationService } from './content-validation.service'
import { SignatureService } from '../../common/services/signature.service'
import { ValidationResultDto } from '../../common/dto/validation-result.dto'
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
    const { selfDescription, raw, participantCredential } = signedSelfDescription

    try {
      const selfDescriptionDataset = await this.shaclService.loadFromJsonLD(raw)
      const shape = await this.shaclService.validate(await this.getShaclShape(), selfDescriptionDataset)
      const content = await this.contentService.validate(selfDescription)

      const isValidSignature = await this.checkParticipantCredential(participantCredential.proof, JSON.parse(raw))

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
      participantCredential: { proof: '', credentialSubject: '' },
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

  private async checkParticipantCredential(proof, selfDescription): Promise<boolean> {
    try {
      const canonizedSd = await this.signatureService.canonize(selfDescription)
      const hash = this.signatureService.hashValue(canonizedSd)
      const verifyResult = await this.signatureService.verify(proof.jws.replace('..', `.${hash}.`), proof?.verificationMethod)

      return hash === verifyResult?.content
    } catch (error) {
      return false
    }
  }

  public async createParticipantCredential(participantSelfDescription) {
    const canonizedSd = await this.signatureService.canonize(participantSelfDescription.selfDescription)

    const hash = this.signatureService.hashValue(canonizedSd)
    const jws = await this.signatureService.sign(hash)

    const credentialSubject = {
      id: participantSelfDescription.selfDescription['@id'],
      hash
    }

    const proof = {
      type: 'JsonWebKey2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      jws,
      verificationMethod: process.env.spki
    }

    return { participantCredential: { credentialSubject, proof } }
  }
}
