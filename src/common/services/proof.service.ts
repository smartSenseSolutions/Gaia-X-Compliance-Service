import { HttpService } from '@nestjs/axios'
import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import * as jose from 'jose'
import { DIDDocument } from 'did-resolver'
import { METHOD_IDS } from '../constants'
import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { clone } from '../utils'
import { HashingUtils } from '../utils/hashing.utils'
import { DidService } from './did.service'
import { RegistryService } from './registry.service'
import { SignatureService, Verification } from './signature.service'

@Injectable()
export class ProofService {
  readonly logger = new Logger(ProofService.name)
  readonly didCache = new Map<string, DIDDocument>()
  readonly certificateCache = new Map<string, string>()

  constructor(
    private readonly httpService: HttpService,
    private readonly registryService: RegistryService,
    private readonly signatureService: SignatureService,
    private readonly didService: DidService
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleCron() {
    this.logger.log('Clearing caches')
    this.didCache.clear()
    this.certificateCache.clear()
  }

  public async validate(
    selfDescriptionCredential: VerifiableCredentialDto<CredentialSubjectDto>,
    isValidityCheck?: boolean,
    jws?: string
  ): Promise<boolean> {
    const { x5u, publicKeyJwk } = await this.getPublicKeys(selfDescriptionCredential)

    const certificatesRaw: string = await this.loadCertificatesRaw(x5u)
    const isValidChain: boolean = await this.registryService.isValidCertificateChain(certificatesRaw)

    if (!isValidChain) {
      this.logger.warn(`VC ${selfDescriptionCredential.id} certificate not trusted`)
      throw new ConflictException(
        `X509 certificate chain could not be resolved against registry trust anchors for VC ${selfDescriptionCredential.id}.`
      )
    }

    if (!(await this.publicKeyMatchesCertificate(publicKeyJwk, certificatesRaw))) {
      this.logger.warn(`VC ${selfDescriptionCredential.id} certificate different from public key in did`)
      throw new ConflictException(`Public Key does not match certificate chain for VC ${selfDescriptionCredential.id}.`)
    }

    const isValidSignature: boolean = await this.checkSignature(
      selfDescriptionCredential,
      isValidityCheck,
      jws,
      selfDescriptionCredential.proof,
      publicKeyJwk
    )

    if (!isValidSignature) {
      this.logger.warn(`VC ${selfDescriptionCredential.id} signature does not match`)
      throw new ConflictException(`The provided signature does not match for VC ${selfDescriptionCredential.id}.`)
    }

    return true
  }

  public async getPublicKeys(selfDescriptionCredential: VerifiableCredentialDto<CredentialSubjectDto>) {
    if (!selfDescriptionCredential || !selfDescriptionCredential.proof) {
      this.logger.warn(`VC ${selfDescriptionCredential.id} has no proof`)
      throw new ConflictException('proof not found in one of the verifiableCredential')
    }
    const { verificationMethod } = await this.loadDDO(selfDescriptionCredential.proof.verificationMethod)

    const jwk = verificationMethod.find(
      method => METHOD_IDS.includes(method.id) || method.id.indexOf(selfDescriptionCredential.proof.verificationMethod) > -1
    )
    if (!jwk) {
      this.logger.warn(`VC ${selfDescriptionCredential.id} DID verificationMethod is absent`)
      throw new ConflictException(`verificationMethod ${selfDescriptionCredential.proof.verificationMethod} not found in did document`)
    }

    const { publicKeyJwk } = jwk
    if (!publicKeyJwk) {
      this.logger.warn(`VC ${selfDescriptionCredential.id} unable to load JWK from did`)
      throw new ConflictException(`Could not load JWK for ${verificationMethod}`)
    }

    const { x5u } = publicKeyJwk
    if (!publicKeyJwk.x5u) {
      this.logger.warn(`VC ${selfDescriptionCredential.id} DID is missing x5u (certificate) url`)
      throw new ConflictException(`The x5u parameter is expected to be set in the JWK for ${verificationMethod}`)
    }

    return { x5u, publicKeyJwk }
  }

  private async checkSignature(selfDescription, isValidityCheck: boolean, jws: string, proof, jwk: any): Promise<boolean> {
    const clonedSD = clone(selfDescription)
    delete clonedSD.proof

    const normalizedSD: string = await this.signatureService.normalize(clonedSD)
    const hashInput: string = isValidityCheck ? normalizedSD + jws : normalizedSD
    const hash: string = HashingUtils.sha256(hashInput)

    try {
      const verificationResult: Verification = await this.signatureService.verify(proof?.jws.replace('..', `.${hash}.`), jwk)
      return verificationResult.content === hash
    } catch (Error) {
      this.logger.error(`Unable to validate signature of VC ${selfDescription.id}`)
    }
  }

  private async publicKeyMatchesCertificate(publicKeyJwk: any, certificatePem: string): Promise<boolean> {
    try {
      const pk = await jose.importJWK(publicKeyJwk)
      const spki = await jose.exportSPKI(pk as jose.KeyLike)

      const x509 = await jose.importX509(certificatePem, 'ES256')
      const spkiX509 = await jose.exportSPKI(x509)

      return spki === spkiX509
    } catch (error) {
      throw new ConflictException('Could not confirm X509 public key with certificate chain.' + error?.message)
    }
  }

  private async loadDDO(did: string): Promise<any> {
    const cachedDID = this.didCache.get(did)
    if (!!cachedDID) {
      return cachedDID
    }
    let didDocument: DIDDocument
    try {
      didDocument = await this.didService.resolveDid(did)
    } catch (error) {
      this.logger.warn(`Unable to load DID from ${did}`, error)
      throw new ConflictException(`Could not load document for given did:web: "${did}"`)
    }
    if (!didDocument?.verificationMethod || didDocument?.verificationMethod?.constructor !== Array) {
      this.logger.warn(`DID ${did} does not contain verificationMethod array`)
      throw new ConflictException(`Could not load verificationMethods in did document at ${didDocument?.verificationMethod}`)
    }
    this.didCache.set(did, didDocument)
    return didDocument || undefined
  }

  public async loadCertificatesRaw(url: string): Promise<string> {
    const certificateCached = this.certificateCache.get(url)
    if (!!certificateCached) {
      return certificateCached
    }
    try {
      const response = await this.httpService.get(url).toPromise()
      const cert = response.data.replace(/\n/gm, '') || undefined
      this.certificateCache.set(url, cert)
      return cert
    } catch (error) {
      this.logger.warn(`Unable to load x509 certificate from  ${url}`)
      throw new ConflictException(`Could not load X509 certificate(s) at ${url}`)
    }
  }
}
