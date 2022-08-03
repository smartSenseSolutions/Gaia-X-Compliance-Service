import { ApiBody, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Body, Controller, HttpStatus, Post, HttpCode, ConflictException, UsePipes } from '@nestjs/common'
import { SelfDescriptionService } from '../common/services'
import { SignedSelfDescriptionDto, ValidationResultDto, VerifiableCredentialDto } from '../common/dto'
import { VerifiableSelfDescriptionDto } from '../participant/dto'
import { VerifyServiceOfferingDto, ServiceOfferingSelfDescriptionDto } from './dto'
import { ApiVerifyResponse } from '../common/decorators'
import { getApiVerifyBodySchema } from '../common/utils/api-verify-raw-body-schema.util'
import { SignedSelfDescriptionSchema, VerifySdSchema } from '../common/schema/selfDescription.schema'
import ServiceOfferingExperimentalSD from '../tests/fixtures/service-offering-sd.json'
import { CredentialTypes } from '../common/enums'
import { UrlSDParserPipe, SDParserPipe, JoiValidationPipe } from '../common/pipes'
import { SelfDescriptionTypes } from '../common/enums'
import { HttpService } from '@nestjs/axios'
import { ValidationResulWithoutContent } from '../common/@types'
import { ServiceOfferingContentValidationService } from './services/content-validation.service'

const credentialType = CredentialTypes.service_offering
@ApiTags(credentialType)
@Controller({ path: 'service-offering', version: ['2206'] })
export class ServiceOfferingController {
  constructor(
    private readonly selfDescriptionService: SelfDescriptionService,
    private readonly serviceOfferingContentValidationService: ServiceOfferingContentValidationService
  ) {}
  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiBody({
    type: VerifyServiceOfferingDto
  })
  @ApiOperation({ summary: 'Validate a Service Offering Self Description from a URL' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new JoiValidationPipe(VerifySdSchema), new UrlSDParserPipe(SelfDescriptionTypes.SERVICE_OFFERING, new HttpService()))
  async verifyServiceOffering(@Body() serviceOfferingSelfDescription: SignedSelfDescriptionDto): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription)
    return validationResult
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Service Offering Self Description' })
  @ApiExtraModels(VerifiableSelfDescriptionDto, VerifiableCredentialDto, ServiceOfferingSelfDescriptionDto)
  @ApiBody(
    getApiVerifyBodySchema(SelfDescriptionTypes.SERVICE_OFFERING, {
      service: { summary: 'Service Offering Experimental SD Example', value: ServiceOfferingExperimentalSD }
    })
  )
  @HttpCode(HttpStatus.OK)
  @UsePipes(new JoiValidationPipe(SignedSelfDescriptionSchema), new SDParserPipe(SelfDescriptionTypes.SERVICE_OFFERING))
  async verifyServiceOfferingRaw(@Body() serviceOfferingSelfDescription: SignedSelfDescriptionDto): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription)
    return validationResult
  }

  private async verifySignedServiceOfferingSD(serviceOfferingSelfDescription: SignedSelfDescriptionDto): Promise<ValidationResultDto> {
    const validationResult: ValidationResulWithoutContent = await this.selfDescriptionService.validate(serviceOfferingSelfDescription)
    const content = await this.serviceOfferingContentValidationService.validate(serviceOfferingSelfDescription.selfDescriptionCredential, {
      conforms: true,
      shape: { conforms: true, results: [] },
      content: { conforms: true, results: [] },
      isValidSignature: true
    })

    if (!validationResult.conforms)
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult,
          content
        },
        error: 'Conflict'
      })

    return {
      ...validationResult,
      content
    }
  }
}
