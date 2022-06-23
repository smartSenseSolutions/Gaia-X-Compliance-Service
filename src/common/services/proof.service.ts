import { BadRequestException, Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { RegistryService } from './registry.service'
import { SignatureService } from './signature.service'
import * as jose from 'jose'
import { VerifiableCredentialDto } from '../dto/credential-meta.dto'
import { ParticipantSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto/service-offering-sd.dto'

export const DID_WEB_PATTERN = /^(did:web:)([a-zA-Z0-9%._-]*:)*[a-zA-Z0-9%._-]+$/
export const BEGIN_CERTIFICATE_DELIMITER = '-----BEGIN CERTIFICATE-----'
@Injectable()
export class ProofService {
  constructor(
    private readonly httpService: HttpService,
    private readonly registryService: RegistryService,
    private readonly signatureService: SignatureService
  ) { }

  public async verify(
    selfDescriptionCredential: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>,
    isValidityCheck?: boolean,
    jws?: string
  ): Promise<boolean> {
    // TODO check if all mandatory fields exist via joi validation
    const { proof } = selfDescriptionCredential
    if (!proof) throw new BadRequestException('Proof property is missing.')
    if (!proof.jws || typeof proof.jws !== 'string') throw new BadRequestException('JWS property is missing or has the wrong type.')

    const { verificationMethod } = proof
    if (!this.isValidDidWeb(verificationMethod)) throw new BadRequestException('verificationMethod is expected to be a resolvable did:web')

    const { verificationMethod: verificationMethod_ddo } = await this.loadDDO(verificationMethod)
    if (!verificationMethod_ddo || verificationMethod_ddo.constructor !== Array)
      throw new BadRequestException(`Could not load verificationMethods in did document at ${verificationMethod}`)

    const jwk = verificationMethod_ddo.find(
      method =>
        method.id === `did:web:compliance.gaia-x.eu#JWK2020-RSA` ||
        method.id === `did:web:compliance.gaia-x.eu#X509-JWK2020` ||
        `did:web:compliance.lab.gaia-x.eu#JWK2020-RSA` ||
        method.id === `did:web:compliance.lab.gaia-x.eu#X509-JWK2020`
    )
    if (!jwk) throw new BadRequestException(`verificationMethod ${verificationMethod} not found in did document`)

    const { publicKeyJwk } = jwk
    if (!publicKeyJwk) throw new BadRequestException(`Could not load JWK for ${verificationMethod}`)

    const { x5u } = publicKeyJwk
    if (!publicKeyJwk.x5u) throw new BadRequestException(`The x5u parameter is expected to be set in the JWK for ${verificationMethod}`)

    const certificatesRaw: string = await this.loadCertificatesRaw(x5u)
    const isValidChain = await this.registryService.isValidCertificateChain(certificatesRaw.replace(/\n/gm, ''))
    if (!isValidChain) throw new BadRequestException(`X509 certificate chain could not be resolved against registry trust anchors.`)

    if (!this.publicKeyMatchesCertificate(publicKeyJwk, certificatesRaw))
      throw new BadRequestException(`Public Key does not match certificate chain.`)

    // TODO refactor isValidityCheck
    const input = (selfDescriptionCredential as any).selfDescription ? (selfDescriptionCredential as any)?.selfDescription : selfDescriptionCredential
    const isValidSignature = await this.checkSignature(input, isValidityCheck, jws, proof, publicKeyJwk)
    if (!isValidSignature) throw new BadRequestException(`Provided signature does not match Self Description.`)

    return true
  }

  private async checkSignature(selfDescription, isValidityCheck: boolean, jws: string, proof, jwk: any): Promise<boolean> {
    const normalizedSD = await this.signatureService.normalize(selfDescription)
    if (normalizedSD === '') throw new BadRequestException('Provided input is not a valid Self Description.')
    const hashInput = normalizedSD // isValidityCheck ? normalizedSD + jws :
    const hash = this.signatureService.sha256(hashInput)

    delete jwk.alg

    const verificationResult = await this.signatureService.verify(proof?.jws.replace('..', `.${hash}.`), jwk)
    return verificationResult.content === hash
  }

  private async publicKeyMatchesCertificate(publicKeyJwk: any, certificatePem: string): Promise<boolean> {
    const pk = await jose.importJWK(publicKeyJwk)
    const spki = await jose.exportSPKI(pk as jose.KeyLike)

    const x509 = await jose.importX509(certificatePem, 'PS256')
    const spkiX509 = await jose.exportSPKI(x509 as jose.KeyLike)

    return spki === spkiX509
  }

  private async loadDDO(did: string): Promise<any> {
    try {
      const response = await this.httpService.get(this.getDidWebDocumentUri(did)).toPromise()
      return response.data || undefined
    } catch (error) {
      throw new BadRequestException(`Could not load document for given did:web: "${did}"`)
    }
  }

  private async loadCertificatesRaw(url: string): Promise<string> {
    try {
      const response = await this.httpService.get(url).toPromise()
      return response.data || undefined
    } catch (error) {
      throw new BadRequestException(`Could not load X509 certificate(s) at ${url}`)
    }
  }

  private getDidWebDocumentUri(did: string): string {
    return `${did.replace('did:web:', 'https://')}/.well-known/did.json`
  }

  private isValidDidWeb(did: string): boolean {
    return DID_WEB_PATTERN.test(did)
  }

  private isSamePublicKey(key1: string, key2: string): boolean {
    return this.cleanPEMPublicKey(key1) === this.cleanPEMPublicKey(key2)
  }

  private cleanPEMPublicKey(publicKey: string): string {
    return publicKey.replace(/([']*-----(BEGIN|END) PUBLIC KEY-----[']*|\n)/gm, '')
  }
}
