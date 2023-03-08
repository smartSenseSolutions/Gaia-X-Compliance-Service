import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { ApiVerifyResponse } from '../common/decorators'
import { getApiVerifyBodySchema } from '../common/utils'
import { SignedSelfDescriptionDto, ValidationResultDto, VerifiableCredentialDto, VerifiableSelfDescriptionDto } from '../common/dto'
import { ParticipantSelfDescriptionDto, VerifyParticipantDto } from './dto'
import { BooleanQueryValidationPipe, JoiValidationPipe, SDParserPipe, UrlSDParserPipe } from '../common/pipes'
import { SignedSelfDescriptionSchema, VerifySdSchema } from '../common/schema/selfDescription.schema'
import ParticipantSD from '../tests/fixtures/participant-sd.json'
import { CredentialTypes, SelfDescriptionTypes } from '../common/enums'
import { HttpService } from '@nestjs/axios'
import { SelfDescriptionService } from '../common/services'
import { ParticipantContentValidationService } from './services/content-validation.service'

const credentialType = CredentialTypes.participant

@ApiTags(credentialType)
@Controller({ path: '/api/participant' })
export class ParticipantController {
  constructor(
    private readonly selfDescriptionService: SelfDescriptionService,
    private readonly participantContentValidationService: ParticipantContentValidationService
  ) {}

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiQuery({
    name: 'store',
    type: Boolean,
    description: 'Store Self Description for learning purposes for six months in the storage service',
    required: false
  })
  @ApiBody({
    type: VerifyParticipantDto
  })
  @ApiOperation({ summary: 'Validate a Participant Self Description from a URL' })
  @HttpCode(HttpStatus.OK)
  async verifyParticipant(
    @Body(new JoiValidationPipe(VerifySdSchema), new UrlSDParserPipe(SelfDescriptionTypes.PARTICIPANT, new HttpService()))
    participantSelfDescription: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean
  ): Promise<ValidationResultDto> {
    return await this.verifyAndStoreSignedParticipantSD(participantSelfDescription, storeSD)
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Participant Self Description' })
  @ApiExtraModels(VerifiableSelfDescriptionDto, VerifiableCredentialDto, ParticipantSelfDescriptionDto)
  @ApiQuery({
    name: 'store',
    type: Boolean,
    description: 'Store Self Description for learning purposes for six months in the storage service',
    required: false
  })
  @ApiBody(
    getApiVerifyBodySchema('Participant', {
      service: { summary: 'Participant SD Example', value: ParticipantSD }
    })
  )
  @HttpCode(HttpStatus.OK)
  async verifyParticipantRaw(
    @Body(new JoiValidationPipe(SignedSelfDescriptionSchema), new SDParserPipe(SelfDescriptionTypes.PARTICIPANT))
    participantSelfDescription: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean
  ): Promise<ValidationResultDto> {
    return await this.verifyAndStoreSignedParticipantSD(participantSelfDescription, storeSD)
  }

  @Post('/:verifyVP')
  @ApiOperation({
    summary: 'Test a compliance rule',
    description:
      'For more details on using this API route please see: https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/dev#api-endpoint-with-dynamic-routes'
  })
  async verifyParticipantVP(@Body() body: any) {
    const validationResult = await this.participantContentValidationService.validateAll(body)
    return validationResult
  }

  @Get('/:functionName')
  @ApiOperation({
    summary: 'Test a compliance rule',
    description:
      'For more details on using this API route please see: https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/dev#api-endpoint-with-dynamic-routes'
  })
  async callFunction(@Param('functionName') functionName: string, @Body() body: any) {
    return this.participantContentValidationService[functionName](body)
  }

  private async verifySignedParticipantSD(
    participantSelfDescription: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>
  ): Promise<ValidationResultDto> {
    const is_valid = await this.selfDescriptionService.verify(participantSelfDescription)
    if (!is_valid.conforms)
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: { ...is_valid },
        error: 'Conflict'
      })
    return is_valid
  }

  private async verifyAndStoreSignedParticipantSD(
    participantSelfDescription: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
    storeSD?: boolean
  ) {
    const result = await this.verifySignedParticipantSD(participantSelfDescription)
    if (result?.conforms && storeSD) result.storedSdUrl = await this.selfDescriptionService.storeSelfDescription(participantSelfDescription)

    return result
  }
}
