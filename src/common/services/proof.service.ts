import { HttpService } from '@nestjs/axios'
import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import * as jose from 'jose'
import {
  DidResolver,
  GaiaXSignatureSigner,
  GaiaXSignatureVerifier,
  JsonWebSignature2020Verifier,
  SignatureValidationException,
  VerifiableCredential
} from '@gaia-x/json-web-signature-2020'
import crypto from 'crypto'
import { DIDDocument, VerificationMethod } from 'did-resolver'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto'
import { METHOD_IDS } from '../constants'
import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from '../dto'
import { CompliantCredentialSubjectDto } from '../dto/compliant-credential-subject.dto'
import { OutputVerifiableCredentialMapperFactory } from '../mapper/output-verifiable-credential-mapper.factory'
import { getDidWeb } from '../utils'
import { RegistryService } from './registry.service'
import { TimeService } from './time.service'

@Injectable()
export class ProofService {
  readonly logger = new Logger(ProofService.name)
  readonly didCache = new Map<string, DIDDocument>()
  readonly certificateCache = new Map<string, string>()

  constructor(
    private readonly timeService: TimeService,
    private readonly httpService: HttpService,
    private readonly registryService: RegistryService,
    private readonly didResolver: DidResolver,
    private readonly gaiaXSignatureVerifier: GaiaXSignatureVerifier,
    private readonly gaiaXSignatureSigner: GaiaXSignatureSigner,
    private readonly jsonWebSignature2020Verifier: JsonWebSignature2020Verifier
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleCron() {
    this.logger.log('Clearing caches')
    this.didCache.clear()
    this.certificateCache.clear()
  }

  /**
   * Creates a compliance credential and makes it a verifiable credential by signing it with
   * the Gaia-X signature algorithm (derived from <a href="https://www.w3.org/community/reports/credentials/CG-FINAL-lds-jws2020-20220721/">JsonWebSignature2020</a>).
   *
   * @param selfDescription the verifiable presentation containing the compliant credentials
   * @param vcid the optional ID to assign to the output verifiable credential instead of a generated ID
   * @returns a single verifiable credential with multiple compliance credentials in the
   * {@code credentialSubject} attribute.
   */
  async createComplianceCredential(
    selfDescription: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>>,
    vcid?: string
  ): Promise<VerifiableCredentialDto<ComplianceCredentialDto>> {
    const compliantCredentialSubjects = selfDescription.verifiableCredential.map(vc => OutputVerifiableCredentialMapperFactory.for(vc).map(vc))

    const issuanceDate: Date = await this.timeService.getNtpTime()
    const lifeExpectancy = +process.env.lifeExpectancy || 90
    const expirationDate: Date = structuredClone(issuanceDate)
    expirationDate.setDate(issuanceDate.getDate() + lifeExpectancy)
    const id = vcid ? vcid : `${process.env.BASE_URL}/credential-offers/${crypto.randomUUID()}`
    const complianceCredential: Omit<VerifiableCredentialDto<CompliantCredentialSubjectDto>, 'proof'> = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/jws-2020/v1',
        `https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#`
      ],
      type: ['VerifiableCredential'],
      id,
      issuer: getDidWeb(),
      issuanceDate: issuanceDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      credentialSubject: compliantCredentialSubjects
    }

    try {
      const verifiableCredential: VerifiableCredential = await this.gaiaXSignatureSigner.sign(complianceCredential)

      const ntpTime: Date = await this.timeService.getNtpTime()
      verifiableCredential.proof.created = ntpTime.toISOString()

      return verifiableCredential as VerifiableCredentialDto<ComplianceCredentialDto>
    } catch (e) {
      this.logger.error('Signature failed', e)
      throw new ConflictException(e.message || e)
    }
  }

  public async validate(
    selfDescriptionCredential: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
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

    await this.verifySignature(selfDescriptionCredential)

    return true
  }

  /**
   * Verifies the signature of the verifiable credential by starting with the Gaia-X signature method implementation. If
   * this fails, the <a href="https://www.w3.org/community/reports/credentials/CG-FINAL-lds-jws2020-20220721/">JsonWebSignature2020</a>
   * implementation is used.
   *
   * @param verifiableCredential the verifiable credential to verify
   * @private
   */
  private async verifySignature(verifiableCredential: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>) {
    try {
      await this.gaiaXSignatureVerifier.verify(verifiableCredential)
    } catch (e) {
      if (e instanceof SignatureValidationException) {
        this.logger.warn(
          `Failed to validate VC ${verifiableCredential.id} with the Gaia-X signature verifier, trying the JsonWebSignature2020 verifier...`
        )

        try {
          await this.jsonWebSignature2020Verifier.verify(verifiableCredential)
        } catch (e2) {
          if (e2 instanceof SignatureValidationException) {
            this.logger.warn(`VC ${verifiableCredential.id} signature does not match`)
            throw new ConflictException(e2.message)
          }
          throw e2 instanceof ConflictException ? e2 : new ConflictException(`Verification failed: ${e2}.`)
        }
      } else {
        throw e instanceof ConflictException ? e : new ConflictException(`Verification failed: ${e}.`)
      }
    }
  }

  public async getPublicKeys(selfDescriptionCredential: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>) {
    if (!selfDescriptionCredential || !selfDescriptionCredential.proof) {
      this.logger.warn(`VC ${selfDescriptionCredential.id} has no proof`)
      throw new ConflictException('proof not found in one of the verifiableCredential')
    }
    const { verificationMethod } = await this.loadDDO(selfDescriptionCredential.proof.verificationMethod)

    const jwk: VerificationMethod = verificationMethod.find(
      (method: VerificationMethod) => METHOD_IDS.includes(method.id) || method.id.indexOf(selfDescriptionCredential.proof.verificationMethod) > -1
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

  private async publicKeyMatchesCertificate(publicKeyJwk: any, certificatePem: string): Promise<boolean> {
    try {
      const pk = await jose.importJWK(publicKeyJwk)
      const spki = await jose.exportSPKI(pk as jose.KeyLike)

      const x509 = await jose.importX509(certificatePem, 'PS256')
      const spkiX509 = await jose.exportSPKI(x509)

      return spki === spkiX509
    } catch (error) {
      throw new ConflictException('Could not confirm X509 public key with certificate chain.' + error?.message)
    }
  }

  private async loadDDO(did: string): Promise<DIDDocument | null> {
    const cachedDID = this.didCache.get(did)
    if (!!cachedDID) {
      return cachedDID
    }
    let didDocument: DIDDocument
    try {
      didDocument = await this.didResolver.resolve(did)
    } catch (error) {
      this.logger.warn(`Unable to load DID from ${did}`, error)
      throw new ConflictException(`Could not load document for given did:web: ${did}`)
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
