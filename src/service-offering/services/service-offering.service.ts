import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ShaclService } from '../../common/services/shacl.service'
import { ServiceOfferingContentValidationService } from './content-validation.service'
import { SignatureService } from '../../common/services/signature.service'
import { ValidationResultDto } from '../../common/dto/validation-result.dto'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { VerifiableSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import { ServiceOfferingSDParserPipe } from '../pipes/service-offering-sd-parser.pipe'
import { SelfDescriptionCredentialDto } from '../../participant/dto/participant-sd.dto'

@Injectable()
export class ServiceOfferingService {
  static readonly SHAPE_PATH = '/shapes/v1/service-offering.ttl'

  constructor(
    private readonly shaclService: ShaclService,
    private readonly contentService: ServiceOfferingContentValidationService,
    private readonly signatureService: SignatureService
  ) { }

  public async validate(signedSelfDescription: any): Promise<ValidationResultDto> {
    const { selfDescription, raw, complianceCredential, proof } = signedSelfDescription

    try {
      const selfDescriptionDataset = await this.shaclService.loadFromJsonLD(raw)

      const shape = await this.shaclService.validate(await this.getShaclShape(), selfDescriptionDataset)
      const content = await this.contentService.validate(selfDescription)
      const isValidSignature = await this.checkParticipantCredential(complianceCredential.proof, JSON.parse(raw), proof.jws)

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

  public async getShaclShape(): Promise<DatasetExt> {
    return await this.shaclService.loadFromUrl(`${process.env.REGISTRY_URL}${ServiceOfferingService.SHAPE_PATH}`)
  }

  //TODO: Extract to function and refactor validate() and validateSelfDescription()
  public async validateSelfDescription(serviceOfferingSelfDescription: SelfDescriptionCredentialDto): Promise<any> {
    const serviceOfferingSDParserPipe = new ServiceOfferingSDParserPipe()

    const verifableSelfDescription: VerifiableSelfDescriptionDto = {
      complianceCredential: { proof: '', credentialSubject: '' },
      selfDescriptionCredential: { selfDescription: serviceOfferingSelfDescription.selfDescription, proof: serviceOfferingSelfDescription.proof }
    }
    const { selfDescription, raw } = serviceOfferingSDParserPipe.transform(verifableSelfDescription)

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

  // TODO remove/unify
  private async checkParticipantCredential(proof, selfDescription, jws: string): Promise<boolean> {
    try {
      const canonizedSd = await this.signatureService.canonize(selfDescription)
      const hash = this.signatureService.hash256(canonizedSd + jws)
      const verifyResult = await this.signatureService.verify(proof.jws.replace('..', `.${hash}.`), proof?.verificationMethod)

      return hash === verifyResult?.content
    } catch (error) {
      return false
    }
  }

  // TODO remove
  public async createComplianceCredential(participantSelfDescription) {
    const canonizedSd = await this.signatureService.canonize(participantSelfDescription.selfDescription)

    const hash = this.signatureService.hash256(canonizedSd)
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

    return { complianceCredential: { credentialSubject, proof } }
  }
}
