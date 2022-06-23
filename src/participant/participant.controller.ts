import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBody, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiVerifyResponse } from '../common/decorators'
import { VerifyParticipantDto } from './dto/verify-participant.dto'
import { SelfDescriptionService } from '../common/services/selfDescription.service'
import { SDParserPipe } from '../common/pipes/sd-parser.pipe'
import { ParticipantSelfDescriptionDto, VerifiableSelfDescriptionDto } from './dto/participant-sd.dto'
import { UrlSDParserPipe } from '../common/pipes/url-sd-parser.pipe'
import { SignedSelfDescriptionDto } from '../common/dto/self-description.dto'
import { VerifiableCredentialDto } from '../common/dto/credential-meta.dto'
import { getApiVerifyBodySchema } from '../common/utils/api-verify-raw-body-schema.util'
import ParticipantSD from '../tests/fixtures/participant-sd.json'
import { HttpService } from '@nestjs/axios'
import { ValidationResultDto } from 'src/common/dto/validation-result.dto'

const credentialType = 'Participant'

@ApiTags(credentialType)
@Controller({ path: 'participant', version: '1' })
export class ParticipantController {
  constructor(private readonly selfDescriptionService: SelfDescriptionService) { }

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiBody({
    type: VerifyParticipantDto
  })
  @ApiOperation({ summary: 'Validate a Participant Self Description from a URL' })
  @HttpCode(HttpStatus.OK)
  async verifyParticipant(
    @Body(new UrlSDParserPipe(new HttpService(), 'LegalPerson')) participantSelfDescription: SignedSelfDescriptionDto
  ): Promise<ValidationResultDto> {
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
  async verifyParticipantRaw(
    @Body(new SDParserPipe('LegalPerson')) participantSelfDescription: SignedSelfDescriptionDto
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifySignedParticipantSD(participantSelfDescription)
    return validationResult
  }

  private async verifySignedParticipantSD(participantSelfDescription: SignedSelfDescriptionDto): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.selfDescriptionService.validate(participantSelfDescription, true)
    if (!validationResult.conforms) throw new ConflictException(validationResult) // TODO match with other error responses

    return validationResult
  }
}
