import { ApiBody, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common'
import { ApiVerifyResponse } from '../common/decorators'
import { getApiVerifyBodySchema } from '../common/utils/api-verify-raw-body-schema.util'
import { SignedSelfDescriptionDto, ValidationResultDto, VerifiableCredentialDto } from '../common/dto'
import { VerifyParticipantDto, ParticipantSelfDescriptionDto, VerifiableSelfDescriptionDto } from './dto'
import { UrlSDParserPipe, SDParserPipe, JoiValidationPipe } from '../common/pipes'
import { SignedSelfDescriptionSchema, VerifySdSchema } from '../common/schema/selfDescription.schema'
import ParticipantSD from '../../tests/fixtures/participant-sd.json'
import { CredentialTypes, SelfDescriptionTypes } from '../common/enums'
import { HttpService } from '@nestjs/axios'
import { ParticipantContentValidationService2 } from './services/content-validation.service'
import { SelfDescriptionService } from '../common/services'

const credentialType = CredentialTypes.participant
@ApiTags(credentialType)
@Controller({ path: 'participant', version: ['2206'] })
export class ParticipantController {
  constructor(
    private readonly selfDescriptionService: SelfDescriptionService,
    private readonly participantContentValidationService: ParticipantContentValidationService2
  ) {}

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiBody({
    type: VerifyParticipantDto
  })
  @ApiOperation({ summary: 'Validate a Participant Self Description from a URL' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new JoiValidationPipe(VerifySdSchema), new UrlSDParserPipe(SelfDescriptionTypes.PARTICIPANT, new HttpService()))
  async verifyParticipant(@Body() participantSelfDescription: SignedSelfDescriptionDto): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifySignedParticipantSD(participantSelfDescription)
    return validationResult
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Participant Self Description' })
  @ApiExtraModels(VerifiableSelfDescriptionDto, VerifiableCredentialDto, ParticipantSelfDescriptionDto)
  @ApiBody(
    getApiVerifyBodySchema('Participant', {
      service: { summary: 'Participant SD Example', value: ParticipantSD }
    })
  )
  @HttpCode(HttpStatus.OK)
  @UsePipes(new JoiValidationPipe(SignedSelfDescriptionSchema), new SDParserPipe(SelfDescriptionTypes.PARTICIPANT))
  async verifyParticipantRaw(@Body() participantSelfDescription: SignedSelfDescriptionDto): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifySignedParticipantSD(participantSelfDescription)
    return validationResult
  }

  private async verifySignedParticipantSD(participantSelfDescription: SignedSelfDescriptionDto): Promise<ValidationResultDto> {
    const validationResult = await this.selfDescriptionService.validate(participantSelfDescription)
    const content = await this.participantContentValidationService.validate(participantSelfDescription.selfDescriptionCredential)

    if (!validationResult.conforms)
      throw new ConflictException({ statusCode: HttpStatus.CONFLICT, message: { ...validationResult, content }, error: 'Conflict' })

    return { ...validationResult, content }
  }
}
