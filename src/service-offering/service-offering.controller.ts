import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, Controller, HttpStatus, Post, HttpCode, ConflictException, UsePipes, Query } from '@nestjs/common'
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
import { BooleanQueryValidationPipe } from '../common/pipes/boolean-query-parameter.pipe'

const credentialType = CredentialTypes.service_offering
@ApiTags(credentialType)
@Controller({ path: 'service-offering' })
export class ServiceOfferingController {
  constructor(private readonly selfDescriptionService: SelfDescriptionService) {}
  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiBody({
    type: VerifyServiceOfferingDto
  })
  @ApiQuery({ name: 'verifyParticipant', type: Boolean, required: false })
  @ApiOperation({ summary: 'Validate a Service Offering Self Description from a URL' })
  @HttpCode(HttpStatus.OK)
  async verifyServiceOffering(
    @Body(new JoiValidationPipe(VerifySdSchema), new UrlSDParserPipe(SelfDescriptionTypes.SERVICE_OFFERING, new HttpService()))
    serviceOfferingSelfDescription: SignedSelfDescriptionDto,
    @Query('verifyParticipant', new BooleanQueryValidationPipe(true)) verifyParticipant: boolean
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription, verifyParticipant)
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
  @ApiQuery({ name: 'verifyParticipant', type: Boolean, required: false })
  @HttpCode(HttpStatus.OK)
  async verifyServiceOfferingRaw(
    @Body(new JoiValidationPipe(SignedSelfDescriptionSchema), new SDParserPipe(SelfDescriptionTypes.SERVICE_OFFERING))
    serviceOfferingSelfDescription: SignedSelfDescriptionDto,
    @Query('verifyParticipant', new BooleanQueryValidationPipe(true)) verifyParticipant: boolean
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription, verifyParticipant)
    return validationResult
  }

  private async verifySignedServiceOfferingSD(
    serviceOfferingSelfDescription: SignedSelfDescriptionDto,
    verifyParticipant = true
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.selfDescriptionService.validate(serviceOfferingSelfDescription, verifyParticipant)
    if (!validationResult.conforms) throw new ConflictException({ statusCode: HttpStatus.CONFLICT, message: validationResult, error: 'Conflict' })

    return validationResult
  }
}
