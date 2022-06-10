import { BadRequestException, Injectable } from '@nestjs/common'
import { createPublicKey } from 'crypto'
import { SelfDescriptionCredentialDto } from 'src/participant/dto/participant-sd.dto'
import { HttpService } from '@nestjs/axios'
import { RegistryService } from './registry.service'
import { SignatureService } from './signature.service'

export const DID_WEB_PATTERN = /^(did:web:)([a-zA-Z0-9%._-]*:)*[a-zA-Z0-9%._-]+$/
export const BEGIN_CERTIFICATE_DELIMITER = '-----BEGIN CERTIFICATE-----'
@Injectable()
export class ProofService {
  constructor(
    private readonly httpService: HttpService,
    private readonly registryService: RegistryService,
    private readonly signatureService: SignatureService
  ) { }

  public async verify(selfDescriptionCredential: SelfDescriptionCredentialDto, isValidityCheck?: boolean, jws?: string): Promise<any> {
    const { proof, selfDescription } = selfDescriptionCredential
    const { verificationMethod } = proof

    if (!this.isValidDidWeb(verificationMethod)) throw new BadRequestException('verificationMethod is expected to be a resolvable did:web')

    const ddo = await this.loadDDO(verificationMethod)

    const { services } = ddo
    if (!services || services.constructor !== Array)
      throw new BadRequestException(`services array expected to be present in the did:web document at ${verificationMethod}`)

    const x509PKService = services.find(service => service.type === 'X509PublicKey')
    const x509CertService = services.find(service => service.type === 'X509Certificate')

    if (!x509CertService || !x509PKService)
      throw new BadRequestException(`Services of type X509PublicKey and X509Certificate are expected in did document`)

    const certificatesRaw = await this.loadX509ServiceEndpoint(x509CertService)
    const certificates = certificatesRaw
      .split(BEGIN_CERTIFICATE_DELIMITER)
      .filter(cert => cert.length > 0)
      .map(cert => `${BEGIN_CERTIFICATE_DELIMITER}${cert}`)

    let validPk = false
    for (const certificate of certificates) {
      const pk = await this.loadX509ServiceEndpoint(x509PKService) //TODO move out of loop
      const pbk = createPublicKey(certificate).export({ type: 'spki', format: 'pem' }).toString()
      if (this.isSamePublicKey(pk, pbk)) {
        validPk = true
        break
      }
    }

    if (!validPk) throw new BadRequestException(`X509 public key does not match the given X509 certificate(s)`)

    const validChain = await this.registryService.isValidCertificateChain(certificatesRaw.replace(/\n/gm, ''))

    if (!validChain) throw new BadRequestException(`X509 certificate chain could not be resolved against registry trust anchors.`)

    // check for valid signature
    const canonizedSd = await this.signatureService.canonize(selfDescription)

    const hash = isValidityCheck ? this.signatureService.hash256(canonizedSd + jws) : this.signatureService.hash256(canonizedSd)
    const verificationResult = await this.signatureService.verify(proof.jws.replace('..', `.${hash}.`), certificates[0])
    if (isValidityCheck) return verificationResult.content === hash
    if (verificationResult.content !== hash) throw new BadRequestException(`Provided signature does not match Self Description.`)

    return true
  }

  // TODO: add DDO types
  async loadDDO(did: string): Promise<any> {
    try {
      const response = await this.httpService.get(this.getDidWebDocumentUri(did)).toPromise()
      return response.data || undefined
    } catch (error) {
      throw new BadRequestException(`Could not load document for given did:web: "${did}"`)
    }
  }

  async loadX509ServiceEndpoint(service: any): Promise<string> {
    try {
      const response = await this.httpService.get(service.serviceEndpoint).toPromise()
      return response.data || undefined
    } catch (error) {
      throw new BadRequestException(`Could not load serviceEndpoint at "${service.serviceEndpoint}"`)
    }
  }

  getDidWebDocumentUri(did: string): string {
    return `${did.replace('did:web:', 'https://')}/.well-known/did.json`
  }

  isValidDidWeb(did: string): boolean {
    return DID_WEB_PATTERN.test(did)
  }

  isSamePublicKey(key1: string, key2: string): boolean {
    return this.cleanPEMPublicKey(key1) === this.cleanPEMPublicKey(key2)
  }

  cleanPEMPublicKey(publicKey: string): string {
    return publicKey.replace(/([']*-----(BEGIN|END) PUBLIC KEY-----[']*|\n)/gm, '')
  }
}
