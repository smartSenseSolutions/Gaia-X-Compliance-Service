import { ConflictException, Controller, Get, HttpCode, HttpException, HttpStatus, Logger, Param, Post, Query, Req } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as jose from 'jose'
import { DIDDocument, VerificationMethod } from 'did-resolver'
import { Request } from 'express'
import { DateTime } from 'luxon'
import { join } from 'path'
import { v4 as uuid } from 'uuid'
import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from '../../common/dto'
import { EncryptionAlgorithmEnum } from '../../common/enum/encryption-algorithm.enum'
import { ProofService, SignatureService } from '../../common/services'
import { DidService } from '../../common/services/did.service'
import { VerifiablePresentationValidationService } from '../../common/services/verifiable-presentation-validation.service'
import { AuthRequestDto } from '../dto/auth-request.dto'
import { AuthSession } from '../model/auth-session'
import { RelyingParty } from '../model/relying-party'

@Controller('/open-id')
export class OpenIdController {
  private readonly logger = new Logger(OpenIdController.name)

  private readonly relyingParty: RelyingParty
  private readonly authSessions: Map<string, AuthSession> = new Map<string, AuthSession>()
  private readonly complianceVerifiableCredentials: Map<string, VerifiableCredentialDto<ComplianceCredentialDto>> = new Map<
    string,
    VerifiableCredentialDto<ComplianceCredentialDto>
  >()

  constructor(
    private readonly configService: ConfigService,
    private readonly signatureService: SignatureService,
    private readonly verifiablePresentationValidationService: VerifiablePresentationValidationService,
    private readonly proofService: ProofService,
    private readonly didService: DidService
  ) {
    this.relyingParty = new RelyingParty(this.configService)
  }

  @Post('authRequest')
  @HttpCode(201)
  // TODO check query params
  async createAuthSession(@Query('client_id') clientId: string, @Query('nonce') nonce: string): Promise<string> {
    const authSessionId: string = uuid()
    const authSession: AuthSession = {
      clientId: clientId,
      nonce: nonce
    }

    this.authSessions.set(authSessionId, authSession) // TODO later on

    return new URL(join('open-id', 'authRequest', authSessionId), this.configService.get<string>('BASE_URL')).toString()
  }

  @Get('authRequest/:authSessionId')
  @HttpCode(200)
  async retrieveAuthRequest(@Param('authSessionId') authSessionId: string): Promise<string> {
    const authSession: AuthSession = this.authSessions.get(authSessionId)
    const authRequest: AuthRequestDto = this.relyingParty.buildAuthRequest(authSessionId, authSession.clientId, authSession.nonce)

    const privateKey: jose.KeyLike = await jose.importPKCS8(this.configService.get<string>('privateKey'), EncryptionAlgorithmEnum.ES256)

    return await new jose.SignJWT({ ...authRequest })
      .setProtectedHeader({ alg: EncryptionAlgorithmEnum.ES256 })
      .setIssuedAt()
      .setIssuer('did:web:verifier.unicorn-home.com') // TODO make this dynamic
      .setSubject(authSession.clientId)
      .setNotBefore(DateTime.now().toUnixInteger())
      .setExpirationTime('30m')
      .sign(privateKey)
  }

  // TODO explain that the VCs are JWT encoded in the input VP
  @Post('verifiablePresentation/:authSessionId')
  @HttpCode(200)
  async receiveVerifiablePresentation(@Param('authSessionId') authSessionId: string, @Req() request: Request): Promise<void> {
    const authSession: AuthSession = this.authSessions.get(authSessionId)
    if (!authSession) {
      throw new HttpException(`No auth session has ID ${authSessionId}`, HttpStatus.NOT_FOUND)
    }

    const claims: jose.JWTPayload = jose.decodeJwt(request.body.vp_token)
    const didDocument: DIDDocument = await this.didService.resolveDid(claims.iss)

    // TODO externalize this
    const extractPayload = async (jwt: string, verificationMethods: VerificationMethod[]) => {
      for (const verificationMethod of verificationMethods) {
        try {
          const { payload } = await jose.jwtVerify(
            request.body.vp_token,
            await jose.importJWK(verificationMethod.publicKeyJwk, EncryptionAlgorithmEnum.ES256)
          )

          if (payload) {
            return payload
          }
        } catch (e) {
          this.logger.warn(`Failed to verify JWT with public key from verification method ${verificationMethod.id} : ${e.message}`)
        }
      }

      throw new Error(`JWT cannot be verified with the given public keys for DID ${claims.iss}`)
    }

    const payload: jose.JWTPayload = await extractPayload(request.body.vp_token, didDocument.verificationMethod)

    if (payload.nonce !== authSession.nonce) {
      throw new HttpException(`The VP token payload nonce doesn't match the auth session nonce`, HttpStatus.BAD_REQUEST)
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

    const validationResult = await this.verifiablePresentationValidationService.validateVerifiablePresentation(verifiablePresentation)
    if (!validationResult.conforms) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult
        },
        error: 'Conflict'
      })
    }

    this.complianceVerifiableCredentials.set(authSessionId, await this.signatureService.createComplianceCredential(verifiablePresentation))
  }

  @Get('complianceCredentials/:authSessionId')
  @HttpCode(200)
  retrieveComplianceCredentials(@Param('authSessionId') authSessionId: string) {
    return this.complianceVerifiableCredentials.get(authSessionId)
  }
}
