import { ApiBody, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, Get, HttpCode, HttpStatus, InternalServerErrorException, Param, Post } from '@nestjs/common'
import { SelfDescriptionService } from '../common/services'
import { SignedSelfDescriptionDto, ValidationResultDto, VerifiableCredentialDto, VerifiableSelfDescriptionDto } from '../common/dto'
import { ServiceOfferingSelfDescriptionDto, VerifyServiceOfferingDto } from './dto'
import { ApiVerifyResponse } from '../common/decorators'
import { getApiVerifyBodySchema } from '../common/utils'
import { SignedSelfDescriptionSchema, VerifySdSchema } from '../common/schema/selfDescription.schema'
import ServiceOfferingExperimentalSD from '../tests/fixtures/service-offering-sd.json'
import { CredentialTypes, SelfDescriptionTypes } from '../common/enums'
import { JoiValidationPipe, SDParserPipe, UrlSDParserPipe } from '../common/pipes'
import { HttpService } from '@nestjs/axios'
import { ServiceOfferingContentValidationService } from './services/content-validation.service'

const credentialType = CredentialTypes.service_offering

@ApiTags(credentialType)
@Controller({ path: '/api/service-offering' })
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
  async verifyServiceOffering(
    @Body(new JoiValidationPipe(VerifySdSchema), new UrlSDParserPipe(SelfDescriptionTypes.SERVICE_OFFERING, new HttpService()))
    serviceOfferingSelfDescription: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>
  ): Promise<ValidationResultDto> {
    return await this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription)
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
  async verifyServiceOfferingRaw(
    @Body(new JoiValidationPipe(SignedSelfDescriptionSchema), new SDParserPipe(SelfDescriptionTypes.SERVICE_OFFERING))
    serviceOfferingSelfDescription: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>
  ): Promise<ValidationResultDto> {
    return await this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription)
  }

  @Get('/:functionName')
  @ApiOperation({
    summary: 'Test a compliance rule',
    description:
      'For more details on using this API route please see: https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/dev#api-endpoint-with-dynamic-routes'
  })
  async callFunction(@Param('functionName') functionName: string, @Body() body: any) {
    return this.serviceOfferingContentValidationService[functionName](body)
  }

  private async verifySignedServiceOfferingSD(
    serviceOfferingSelfDescription: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
    _verifyParticipant = true // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<ValidationResultDto> {
    try {
      const validationResult: ValidationResultDto = await this.selfDescriptionService.verify(serviceOfferingSelfDescription)
      if (!validationResult.conforms) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: {
            ...validationResult
          },
          error: 'Conflict'
        })
      }
      return validationResult
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      }
      if (error.status == 409) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: error.response.message,
          error: 'Conflict'
        })
      } else {
        throw new InternalServerErrorException()
      }
    }
  }
}
