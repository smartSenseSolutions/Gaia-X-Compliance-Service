import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as jose from 'jose'
import { DIDDocument } from 'did-resolver'
import { KeyLike } from 'jose'
import { DateTime } from 'luxon'
import { join } from 'path'
import { v4 as uuid } from 'uuid'
import { CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from '../../common/dto'
import { EncryptionAlgorithmEnum } from '../../common/enum/encryption-algorithm.enum'
import { ProofService } from '../../common/services'
import { DidService } from '../../common/services/did.service'
import { AuthRequestDto } from '../dto/auth-request.dto'
import { AuthSession } from '../model/auth-session'
import { RelyingParty } from '../model/relying-party'
import { AuthSessionNotFoundException } from './exception/auth-session-not-found.exception'
import { InvalidNonceException } from './exception/invalid-nonce.exception'
import { JwtVerificationException } from './exception/jwt-verification.exception'

// TODO document this
@Injectable()
export class OpenIdVpService {
  private readonly logger = new Logger(OpenIdVpService.name)

  private readonly relyingParty: RelyingParty
  private readonly authSessions: Map<string, AuthSession> = new Map<string, AuthSession>()

  constructor(
    private readonly configService: ConfigService,
    @Inject('josePrivateKey') private readonly privateKey: KeyLike,
    private readonly didService: DidService,
    private readonly proofService: ProofService
  ) {
    this.relyingParty = new RelyingParty(this.configService)
  }

  // TODO document this
  createAuthSession(clientId: string, nonce: string): string {
    const authSessionId: string = uuid()
    const authSession: AuthSession = {
      clientId: clientId,
      nonce: nonce
    }

    this.authSessions.set(authSessionId, authSession) // TODO later on

    return new URL(join('open-id', 'authRequest', authSessionId), this.configService.get<string>('BASE_URL')).toString()
  }

  // TODO document this
  async buildAuthRequest(authSessionId: string): Promise<string> {
    const authSession: AuthSession = this.authSessions.get(authSessionId)
    const authRequest: AuthRequestDto = this.relyingParty.buildAuthRequest(authSessionId, authSession.clientId, authSession.nonce)

    return await new jose.SignJWT({ ...authRequest })
      .setProtectedHeader({ alg: EncryptionAlgorithmEnum.ES256 })
      .setIssuedAt()
      .setIssuer('did:web:verifier.unicorn-home.com') // TODO make this dynamic
      .setSubject(authSession.clientId)
      .setNotBefore(DateTime.now().toUnixInteger())
      .setExpirationTime('30m')
      .sign(this.privateKey)
  }

  // TODO document this and exceptions
  async extractVerifiablePresentation(
    authSessionId: string,
    vpToken: string
  ): Promise<VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>>> {
    const authSession: AuthSession = this.authSessions.get(authSessionId)
    if (!authSession) {
      throw new AuthSessionNotFoundException(authSessionId)
    }

    const claims: jose.JWTPayload = jose.decodeJwt(vpToken)
    const didDocument: DIDDocument = await this.didService.resolveDid(claims.iss)

    const payload: jose.JWTPayload = await this.verifyAndExtractPayload(vpToken, didDocument)

    if (payload.nonce !== authSession.nonce) {
      throw new InvalidNonceException(authSessionId)
    }

    const verifiablePresentation: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>> = new VerifiablePresentationDto()
    // TODO set ID
    verifiablePresentation['@context'] = payload.vp['@context']
    verifiablePresentation['@type'] = ['VerifiablePresentation']
    verifiablePresentation.verifiableCredential = []

    const verifiableCredentials: VerifiableCredentialDto<CredentialSubjectDto>[] = (payload.vp as any).verifiableCredential.map(
      (vcJwt: string) => jose.decodeJwt(vcJwt).vc
    )

    for (const vc of verifiableCredentials) {
      const validSignature: boolean = await this.proofService.validate(vc, false, vc.proof.jws)
      if (!validSignature) {
        throw new HttpException(`Verifiable credential with ID ${vc.id} has an invalid signature`, HttpStatus.BAD_REQUEST)
      }

      verifiablePresentation.verifiableCredential.push(vc)
    }

    return verifiablePresentation
  }

  private async verifyAndExtractPayload(jwt: string, didDocument: DIDDocument) {
    for (const verificationMethod of didDocument.verificationMethod) {
      try {
        const { payload } = await jose.jwtVerify(jwt, await jose.importJWK(verificationMethod.publicKeyJwk, EncryptionAlgorithmEnum.ES256))

        if (payload) {
          return payload
        }
      } catch (e) {
        this.logger.warn(`Failed to verify JWT with public key from verification method ${verificationMethod.id} : ${e.message}`)
      }
    }

    throw new JwtVerificationException(didDocument.id)
  }
}
