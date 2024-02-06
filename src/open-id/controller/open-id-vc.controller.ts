import { Body, Get, Header, Headers, HttpCode, Inject, Injectable, Param, Post } from '@nestjs/common'
import { CommonCredentialRequest, CreateCredentialOfferURIResult, CredentialRequestJwtVc, CredentialResponse } from '@sphereon/oid4vci-common'
import { KeyLike } from 'jose'
import { PreAuthorizedCodeUtils } from '../../../../gaia-x-oidc4vc/utils/pre-authorized-code.utils'
import { ComplianceCredentialDto, VerifiableCredentialDto } from '../../common/dto'
import { OpenIdVcService } from '../service/open-id-vc.service'
import { SignedCredentialStorageService } from '../service/signed-credential-storage.service'

// TODO document this with details about the link with OIDC4VP
@Injectable()
export class OpenIdVcController {
  constructor(
    @Inject('josePublicKey') private readonly publicKey: KeyLike,
    private readonly openIdVcService: OpenIdVcService,
    private readonly signedCredentialStorageService: SignedCredentialStorageService
  ) {}

  @Post('requestCredential/:authSessionId')
  @HttpCode(201)
  @Header('Content-Type', 'application/json')
  requestCredential(@Param('authSessionId') authSessionId: string): Promise<CreateCredentialOfferURIResult> {
    const credential: VerifiableCredentialDto<ComplianceCredentialDto> = this.signedCredentialStorageService.get(authSessionId)

    return this.openIdVcService.createCredentialOffer(authSessionId, credential)
  }

  @Get('credentialOffer/:authSessionId')
  @HttpCode(200)
  @Header('Content-Type', 'application/json')
  async getCredentialOffer(@Param('authSessionId') authSessionId: string) {
    const credentialOfferSession = await this.openIdVcService.getCredentialOffer(authSessionId)

    return credentialOfferSession.credentialOffer.credential_offer
  }

  @Post('credential')
  @HttpCode(200)
  @Header('Content-Type', 'application/json')
  async issueCredential(
    @Headers('Authorization') authz: string,
    @Body() credentialRequest: CommonCredentialRequest & CredentialRequestJwtVc
  ): Promise<CredentialResponse> {
    const preAuthorizedCode: string = await PreAuthorizedCodeUtils.extractFromJwt(authz, this.publicKey)

    return this.openIdVcService.issueCredential(preAuthorizedCode as string, credentialRequest)
  }
}
