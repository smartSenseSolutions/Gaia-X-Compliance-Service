import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiTags, OmitType } from '@nestjs/swagger'
import { ApiVerifyResponse } from '../common/decorators'
import { VerifyParticipantDto } from './dto/verify-participant.dto'
import { ParticipantService } from './services/participant.service'
import { SignatureService } from '../common/services/signature.service'
import { ParticipantSDParserPipe } from './pipes/participant-sd-parser.pipe'
import { SignedParticipantSelfDescriptionDto } from './dto/participant-sd.dto'
import { Response } from 'express'
import { ParticipantUrlSDParserPipe } from './pipes/participant-url-sd-parser.pipe'
import { VerifyParticipantRawDto } from './dto/verify-participant-raw.dto'

const credentialType = 'Participant'
@ApiTags(credentialType)
@Controller('participant')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService, private readonly signatureService: SignatureService) {}

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiBody({
    type: VerifyParticipantDto
  })
  async verifyParticipant(
    @Body(ParticipantUrlSDParserPipe) participantSelfDescription: SignedParticipantSelfDescriptionDto,
    @Res() response: Response
  ) {
    this.verifySignedParticipantSD(participantSelfDescription, response)
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
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
  @Post('signature/sign')
  @ApiBody({
    type: OmitType(VerifyParticipantRawDto, ['proof'])
  })
  async signContent(@Body() content: VerifyParticipantDto) {
    const result = await this.signatureService.sign(JSON.stringify(content))

    const signedSelfDescription = {
      ...content,
      proof: {
        type: 'RsaSignature2018',
        created: new Date(),
        proofPurpose: 'assertionMethod',
        verifcationMethod: result.spkiPem,
        jws: result.jws
      }
    }

    return signedSelfDescription
  }

  private async verifySignedParticipantSD(participantSelfDescription: SignedParticipantSelfDescriptionDto, response: Response) {
    const validationResult = await this.participantService.validate(participantSelfDescription)

    response.status(validationResult.conforms ? HttpStatus.OK : HttpStatus.CONFLICT).send(validationResult)
  }
}
