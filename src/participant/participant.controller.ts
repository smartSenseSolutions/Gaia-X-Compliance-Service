import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiVerifyResponse } from '../common/decorators'
import { VerifyParticipantDto } from './dto/verify-participant.dto'
import { ParticipantService } from './services/participant.service'
import { SignatureService } from '../common/services/signature.service'
import { ParticipantSDParserPipe } from './pipes/participant-sd-parser.pipe'
import { SignedParticipantSelfDescriptionDto } from './dto/participant-sd.dto'
import { Response } from 'express'
import { ParticipantUrlSDParserPipe } from './pipes/participant-url-sd-parser.pipe'
import { VerifyParticipantRawDto } from './dto/verify-participant-raw.dto'
import { ParticipantSelfDescriptionDto } from './dto/participant-sd.dto'

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
    type: VerifyParticipantRawDto
  })
  async verifyParticipantRaw(
    @Body(ParticipantSDParserPipe) participantSelfDescription: SignedParticipantSelfDescriptionDto,
    @Res() response: Response
  ) {
    this.verifySignedParticipantSD(participantSelfDescription, response)
  }

  @ApiResponse({
    status: 200,
    description: 'Succesfully signed posted content. Will return the posted JSON with an additional "proof" property added.'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid JSON request body.'
  })
  //TODO: add new e2e test for 409
  @ApiResponse({
    status: 409,
    description: 'Invalid Participant Self Description.'
  })
  @ApiBody({
    type: ParticipantSelfDescriptionDto
  })
  @ApiOperation({ summary: 'Canonize, hash and sign a valid Participant Self Description' })
  @Post('signature/sign')
  // TODO extract to controller and service
  async signContent(@Body() participantSelfDescription: ParticipantSelfDescriptionDto, @Res() response: Response) {
    const { conforms, shape, content } = await this.participantService.validateSelfDescription(participantSelfDescription)

    if (!conforms) {
      return response.status(HttpStatus.CONFLICT).send({ shape, content })
    }

    const credentialSubject = await this.participantService.createCredentialSubject(participantSelfDescription)

    return response.status(HttpStatus.OK).send({ credentialSubject })
  }
  // @ApiVerifyResponse(credentialType)
  @Post('normalize')
  @ApiResponse({
    status: 200,
    description: 'Noramlized self description.'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.'
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid Participant Self Description.'
  })
  @ApiOperation({ summary: 'Normalize (canonize) a valid Participant Self Description using URDNA2015' })
  @ApiBody({
    type: ParticipantSelfDescriptionDto
  })
  async noramlizeParticipantRaw(@Body() participantSelfDescription: ParticipantSelfDescriptionDto, @Res() response: Response) {
    const { conforms, shape, content } = await this.participantService.validateSelfDescription(participantSelfDescription)

    if (!conforms) {
      return response.status(HttpStatus.CONFLICT).send({ shape, content })
    }

    const canonizedSD = await this.signatureService.canonize(participantSelfDescription)

    return response.status(HttpStatus.OK).send(canonizedSD)
  }

  private async verifySignedParticipantSD(participantSelfDescription: SignedParticipantSelfDescriptionDto, response: Response) {
    const validationResult = await this.participantService.validate(participantSelfDescription)

    response.status(validationResult.conforms ? HttpStatus.OK : HttpStatus.CONFLICT).send(validationResult)
  }
}
