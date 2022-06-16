import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiVerifyResponse } from '../common/decorators'
import { VerifyParticipantDto } from './dto/verify-participant.dto'
import { SelfDescriptionService } from '../common/services/selfDescription.service'
import { SignatureService } from '../common/services/signature.service'
import { SDParserPipe } from '../common/pipes/sd-parser.pipe'
import { SignedParticipantSelfDescriptionDto, VerifiableSelfDescriptionDto } from './dto/participant-sd.dto'
import { Response } from 'express'
import { UrlSDParserPipe } from '../common/pipes/url-sd-parser.pipe'
import { SignedSelfDescriptionDto } from '../common/dto/self-description.dto'

const credentialType = 'Participant'
@ApiTags(credentialType)
@Controller({ path: 'participant', version: '1' })
export class ParticipantController {
  constructor(private readonly selfDescriptionService: SelfDescriptionService, private readonly signatureService: SignatureService) { }

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiBody({
    type: VerifyParticipantDto
  })
  @ApiOperation({ summary: 'Validate a Participant Self Description from a URL' })
  async verifyParticipant(@Body(UrlSDParserPipe) participantSelfDescription: SignedSelfDescriptionDto, @Res() response: Response) {
    this.verifySignedParticipantSD(participantSelfDescription, response)
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Participant Self Description' })
  @ApiBody({
    type: VerifiableSelfDescriptionDto
  })
  async verifyParticipantRaw(@Body(SDParserPipe) participantSelfDescription: SignedSelfDescriptionDto, @Res() response: Response) {
    this.verifySignedParticipantSD(participantSelfDescription, response)
  }

  private async verifySignedParticipantSD(participantSelfDescription: SignedSelfDescriptionDto, response: Response) {
    try {
      const validationResult = await this.selfDescriptionService.validate(participantSelfDescription, true)

      response.status(validationResult.conforms ? HttpStatus.OK : HttpStatus.CONFLICT).send(validationResult)
    } catch (error) {
      response.sendStatus(HttpStatus.BAD_REQUEST)
    }
  }
}
