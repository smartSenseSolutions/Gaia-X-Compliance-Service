import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { RegistryService } from './registry.service'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto'
import { SignatureService, Verification } from './signature.service'
import { VerifiableCredentialDto } from '../dto'
import * as jose from 'jose'
import { METHOD_IDS } from '../constants'
import { DIDDocument, Resolver } from 'did-resolver'
import web from 'web-did-resolver'
import { clone } from '../utils'

const webResolver = web.getResolver()
const resolver = new Resolver(webResolver)
const logger = new Logger('Signature service')
@Injectable()
export class ProofService {
  constructor(
    private readonly httpService: HttpService,
    private readonly registryService: RegistryService,
    private readonly signatureService: SignatureService
  ) {}

  public async validate(
    selfDescriptionCredential: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>,
    waltid?: boolean
  ): Promise<boolean> {
    const { x5u, publicKeyJwk } = await this.getPublicKeys(selfDescriptionCredential)

    const certificatesRaw: string = await this.loadCertificatesRaw(x5u)
    const isValidChain: boolean = await this.registryService.isValidCertificateChain(certificatesRaw)

    if (!isValidChain) throw new ConflictException(`X509 certificate chain could not be resolved against registry trust anchors.`)

    if (!(await this.publicKeyMatchesCertificate(publicKeyJwk, certificatesRaw)))
      throw new ConflictException(`Public Key does not match certificate chain.`)
    const isValidSignature: boolean = await this.checkSignature(selfDescriptionCredential, selfDescriptionCredential.proof, publicKeyJwk, waltid)
    if (!isValidSignature) throw new ConflictException(`Provided signature does not match Self Description.`)
    logger.log('signature validated')
    return true
  }

  public async getPublicKeys(selfDescriptionCredential) {
    if (!selfDescriptionCredential || !selfDescriptionCredential.proof) {
      throw new ConflictException('proof not found in one of the verifiableCredential')
    }
    const { verificationMethod, id } = await this.loadDDO(selfDescriptionCredential.proof.verificationMethod)

    const jwk = verificationMethod.find(method => METHOD_IDS.includes(method.id) || method.id.startsWith(id))
    if (!jwk) throw new ConflictException(`verificationMethod ${verificationMethod} not found in did document`)

    const { publicKeyJwk } = jwk
    if (!publicKeyJwk) throw new ConflictException(`Could not load JWK for ${verificationMethod}`)

    const { x5u } = publicKeyJwk
    if (!publicKeyJwk.x5u) throw new ConflictException(`The x5u parameter is expected to be set in the JWK for ${verificationMethod}`)

    return { x5u, publicKeyJwk }
  }

  private async checkSignature(selfDescription, proof, jwk: any, waltid?: any): Promise<boolean> {
    if (waltid === true) {
      logger.log('Beginning Waltid signature verification')
      const proof = { ...selfDescription.proof }
      const proof_copy = { ...selfDescription.proof }
      delete selfDescription.proof
      delete proof_copy.jws
      proof_copy['@context'] = selfDescription['@context']
      const normalizedComplianceCredential: string = await this.signatureService.normalize(selfDescription)
      const normalizedProof = await this.signatureService.normalize(proof_copy)
      const hashComplianceCredential = this.signatureService.sha256_bytes(normalizedComplianceCredential)
      const hashP = this.signatureService.sha256_bytes(normalizedProof)
      const hash = new Uint8Array(64)
      hash.set(hashP)
      hash.set(hashComplianceCredential, 32)
      const verificationResult = await this.signatureService.verify_walt(proof.jws, jwk, hash)
      selfDescription.proof = proof
      return Buffer.from(verificationResult.content).toString('hex') === Buffer.from(hash).toString('hex')
    } else {
      logger.log('Beginning signature verification')
      const clonedSD = clone(selfDescription)
      delete clonedSD.proof

      const normalizedSD: string = await this.signatureService.normalize(clonedSD)
      const hashInput: string = normalizedSD
      const hash: string = this.signatureService.sha256(hashInput)

      const verificationResult: Verification = await this.signatureService.verify(proof?.jws.replace('..', `.${hash}.`), jwk)
      return verificationResult.content === hash
    }
  }

  private async publicKeyMatchesCertificate(publicKeyJwk: any, certificatePem: string): Promise<boolean> {
    try {
      const pk = await jose.importJWK(publicKeyJwk)
      const spki = await jose.exportSPKI(pk as jose.KeyLike)

      const x509 = await jose.importX509(certificatePem, 'PS256')
      const spkiX509 = await jose.exportSPKI(x509)

      return spki === spkiX509
    } catch (error) {
      throw new ConflictException('Could not confirm X509 public key with certificate chain.')
    }
  }

  private async loadDDO(did: string): Promise<any> {
    let didDocument
    try {
      didDocument = await this.getDidWebDocument(did)
    } catch (error) {
      throw new ConflictException(`Could not load document for given did:web: "${did}"`)
    }
    if (!didDocument?.verificationMethod || didDocument?.verificationMethod?.constructor !== Array)
      throw new ConflictException(`Could not load verificationMethods in did document at ${didDocument?.verificationMethod}`)

    return didDocument || undefined
  }

  public async loadCertificatesRaw(url: string): Promise<string> {
    try {
      const response = await this.httpService.get(url).toPromise()
      return response.data.replace(/\n/gm, '') || undefined
    } catch (error) {
      throw new ConflictException(`Could not load X509 certificate(s) at ${url}`)
    }
  }

  private async getDidWebDocument(did: string): Promise<DIDDocument> {
    const doc = await resolver.resolve(did)

    return doc.didDocument
  }
}
