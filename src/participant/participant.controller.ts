import { ApiBody, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiVerifyResponse } from '../common/decorators'
import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common'
import { getApiVerifyBodySchema } from '../common/utils/api-verify-raw-body-schema.util'
import { SelfDescriptionService } from '../common/services'
import { SignedSelfDescriptionDto, ValidationResultDto, VerifiableCredentialDto } from '../common/dto'
import { VerifyParticipantDto, ParticipantSelfDescriptionDto, VerifiableSelfDescriptionDto } from './dto'
import { UrlSDParserPipe, SDParserPipe, JoiValidationPipe } from '../common/pipes'
import { SignedSelfDescriptionSchema, VerifySdSchema } from '../common/schema/selfDescription.schema'
import ParticipantSD from '../tests/fixtures/participant-sd.json'
import { CredentialTypes, SelfDescriptionTypes } from '../common/enums'
import { HttpService } from '@nestjs/axios'

const credentialType = CredentialTypes.participant
@ApiTags(credentialType)
@Controller({ path: 'participant', version: ['2204'] })
export class ParticipantController {
  constructor(private readonly selfDescriptionService: SelfDescriptionService) {}

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
    const validationResult: ValidationResultDto = await this.selfDescriptionService.validate(participantSelfDescription, true)
    if (!validationResult.conforms) throw new ConflictException({ statusCode: HttpStatus.CONFLICT, message: validationResult, error: 'Conflict' })

    return validationResult
  }
}
