import { Body, Controller, HttpStatus, Post, Res, HttpCode, ConflictException } from '@nestjs/common'
import { ApiBody, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiVerifyResponse } from '../common/decorators'
import { Response } from 'express'
import { VerifiableSelfDescriptionDto } from '../participant/dto/participant-sd.dto'
import { ServiceOfferingSelfDescriptionDto } from './dto/service-offering-sd.dto'
import { VerifyServiceOfferingDto } from './dto/verify-service-offering.dto'
import { SDParserPipe } from '../common/pipes/sd-parser.pipe'
import { UrlSDParserPipe } from '../common/pipes/url-sd-parser.pipe'
import { SelfDescriptionService } from '../common/services/selfDescription.service'
import { SignedSelfDescriptionDto } from '../common/dto/self-description.dto'
import { getApiVerifyBodySchema } from '../common/utils/api-verify-raw-body-schema.util'
import ServiceOfferingExperimentalSD from '../tests/fixtures/service-offering-sd.json'
import { VerifiableCredentialDto } from '../common/dto/credential-meta.dto'
import { HttpService } from '@nestjs/axios'
import { ValidationResultDto } from '../common/dto/validation-result.dto'

const credentialType = 'Service Offering (experimental)'
@ApiTags(credentialType)
@Controller({ path: 'service-offering', version: '1' })
export class ServiceOfferingController {
  constructor(private readonly selfDescriptionService: SelfDescriptionService) { }
  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiBody({
    type: VerifyServiceOfferingDto
  })
  @ApiOperation({ summary: 'Validate a Service Offering Self Description from a URL' })
  @HttpCode(HttpStatus.OK)
  async verifyServiceOffering(
    @Body(new UrlSDParserPipe(new HttpService(), 'ServiceOfferingExperimental')) serviceOfferingSelfDescription: SignedSelfDescriptionDto
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription)
    return validationResult
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Service Offering Self Description' })
  @ApiExtraModels(VerifiableSelfDescriptionDto, VerifiableCredentialDto, ServiceOfferingSelfDescriptionDto)
  @ApiBody(
    getApiVerifyBodySchema('ServiceOfferingExperimental', {
      service: { summary: 'Service Offering Experimental SD Example', value: ServiceOfferingExperimentalSD }
    })
  )
  @HttpCode(HttpStatus.OK)
  async verifyServiceOfferingRaw(
    @Body(new SDParserPipe('ServiceOfferingExperimental')) serviceOfferingSelfDescription: SignedSelfDescriptionDto
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription)
    return validationResult
  }

  private async verifySignedServiceOfferingSD(serviceOfferingSelfDescription: SignedSelfDescriptionDto): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.selfDescriptionService.validate(serviceOfferingSelfDescription, true)
    if (!validationResult.conforms) throw new ConflictException(validationResult) // TODO match with other error responses

    return validationResult
  }
}
