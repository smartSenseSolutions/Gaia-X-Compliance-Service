import { ConflictException, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Post, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from '../../common/dto'
import { SignatureService } from '../../common/services'
import { VerifiablePresentationValidationService } from '../../common/services/verifiable-presentation-validation.service'
import { AuthSessionNotFoundException } from '../service/exception/auth-session-not-found.exception'
import { InvalidNonceException } from '../service/exception/invalid-nonce.exception'
import { JwtVerificationException } from '../service/exception/jwt-verification.exception'
import { OpenIdVpService } from '../service/open-id-vp.service'
import { SignedCredentialStorageService } from '../service/signed-credential-storage.service'

@Controller('/open-id-vp')
export class OpenIdVpController {
  constructor(
    private readonly signatureService: SignatureService,
    private readonly verifiablePresentationValidationService: VerifiablePresentationValidationService,
    private readonly openIdVpService: OpenIdVpService,
    private readonly signedCredentialStorageService: SignedCredentialStorageService
  ) {}

  @Post('authRequest')
  @HttpCode(201)
  // TODO check query params
  createAuthSession(@Query('client_id') clientId: string, @Query('nonce') nonce: string): string {
    return this.openIdVpService.createAuthSession(clientId, nonce)
  }

  @Get('authRequest/:authSessionId')
  @HttpCode(200)
  async retrieveAuthRequest(@Param('authSessionId') authSessionId: string): Promise<string> {
    return this.openIdVpService.buildAuthRequest(authSessionId)
  }

  // TODO explain that the VCs are JWT encoded in the input VP
  @Post('verifiablePresentation/:authSessionId')
  @HttpCode(200)
  async receiveVerifiablePresentation(@Param('authSessionId') authSessionId: string, @Req() request: Request): Promise<void> {
    try {
      const verifiablePresentation: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>> =
        await this.openIdVpService.extractVerifiablePresentation(authSessionId, request.body.vp_token)

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

      this.signedCredentialStorageService.set(authSessionId, await this.signatureService.createComplianceCredential(verifiablePresentation))
    } catch (e) {
      // TODO externalize to custom exception HTTP mapping
      if (e instanceof AuthSessionNotFoundException) {
        throw new HttpException(e.message, HttpStatus.NOT_FOUND)
      }

      if (e instanceof JwtVerificationException || e instanceof InvalidNonceException) {
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
      }
    }
  }
}
