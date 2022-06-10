import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiVerifyResponse } from '../common/decorators'
import { VerifyParticipantDto } from './dto/verify-participant.dto'
import { ParticipantService } from './services/participant.service'
import { SignatureService } from '../common/services/signature.service'
import { ParticipantSDParserPipe } from './pipes/participant-sd-parser.pipe'
import { SignedParticipantSelfDescriptionDto, VerifiableSelfDescriptionDto } from './dto/participant-sd.dto'
import { Response } from 'express'
import { ParticipantUrlSDParserPipe } from './pipes/participant-url-sd-parser.pipe'

const credentialType = 'Participant'
@ApiTags(credentialType)
@Controller({ path: 'participant', version: '1' })
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService, private readonly signatureService: SignatureService) { }

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiBody({
    type: VerifyParticipantDto
  })
  @ApiOperation({ summary: 'Validate a Participant Self Description from a URL' })
  async verifyParticipant(
    @Body(ParticipantUrlSDParserPipe) participantSelfDescription: SignedParticipantSelfDescriptionDto,
    @Res() response: Response
  ) {
    this.verifySignedParticipantSD(participantSelfDescription, response)
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Participant Self Description' })
  @ApiBody({
    type: VerifiableSelfDescriptionDto
  })
  async verifyParticipantRaw(
    @Body(ParticipantSDParserPipe) participantSelfDescription: SignedParticipantSelfDescriptionDto,
    @Res() response: Response
  ) {
    this.verifySignedParticipantSD(participantSelfDescription, response)
  }

  private async verifySignedParticipantSD(participantSelfDescription: SignedParticipantSelfDescriptionDto, response: Response) {
    try {
      const validationResult = await this.participantService.validate(participantSelfDescription)

      response.status(validationResult.conforms ? HttpStatus.OK : HttpStatus.CONFLICT).send(validationResult)
    } catch (error) {
      response.sendStatus(HttpStatus.BAD_REQUEST)
    }
  }
}
