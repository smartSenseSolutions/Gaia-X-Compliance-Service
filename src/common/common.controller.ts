import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ParticipantService } from '../participant/services/participant.service'
import { ServiceOfferingService } from '../service-offering/services/service-offering.service'
import { SignatureService } from './services/signature.service'
import { SelfDescriptionCredentialDto, WrappedParticipantSelfDescriptionDto } from '../participant/dto/participant-sd.dto'
import { Response } from 'express'
import { ProofService } from './services/proof.service'

const credentialType = 'Common'
@ApiTags(credentialType)
@Controller({ path: '', version: '1' })
export class CommonController {
  constructor(
    private readonly participantService: ParticipantService,
    private readonly serviceOfferingService: ServiceOfferingService,
    private readonly signatureService: SignatureService,
    private readonly proofService: ProofService
  ) {}

  @ApiResponse({
    status: 200,
    description: 'Succesfully signed posted content. Will return the posted JSON with an additional "proof" property added.'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid JSON request body.'
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid Participant Self Description.'
  })
  @ApiBody({
    type: SelfDescriptionCredentialDto
  })
  @ApiOperation({ summary: 'Canonize, hash and sign a valid Self Description' })
  @Post('sign')
  async signContent(@Body() selfDescriptionCredential: SelfDescriptionCredentialDto, @Res() response: Response) {
    const validProof = await this.proofService.verify(selfDescriptionCredential)

    if (!validProof) {
      return response.sendStatus(HttpStatus.BAD_REQUEST)
    }

    const type = selfDescriptionCredential.selfDescription['@type']
    let validationResult = null

    switch (type) {
      case 'gx-participant:LegalPerson':
        validationResult = await this.participantService.validateSelfDescription(selfDescriptionCredential)
        break
      case 'gx-service-offering:ServiceOffering':
        validationResult = await this.serviceOfferingService.validateSelfDescription(selfDescriptionCredential)
        break
    }

    if (!validationResult) {
      return response.sendStatus(HttpStatus.BAD_REQUEST)
    }

    if (!validationResult?.conforms) {
      return response.status(HttpStatus.CONFLICT).send({ shape: validationResult.shape, content: validationResult.content })
    }

    const complianceCredential = await this.signatureService.createComplianceCredential(
      selfDescriptionCredential.selfDescription,
      selfDescriptionCredential.proof.jws
    )

    return response.status(HttpStatus.OK).send(complianceCredential)
  }
  @Post('normalize')
  @ApiResponse({
    status: 200,
    description: 'Normalized Self Description.'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.'
  })
  @ApiOperation({ summary: 'Normalize (canonize) a Self Description using URDNA2015' })
  @ApiBody({
    type: WrappedParticipantSelfDescriptionDto
  })
  async noramlizeParticipantRaw(@Body() participantSelfDescription: WrappedParticipantSelfDescriptionDto, @Res() response: Response) {
    const canonizedSD = await this.signatureService.canonize(participantSelfDescription.selfDescription)
    return response.status(canonizedSD !== '' ? HttpStatus.OK : HttpStatus.BAD_REQUEST).send(canonizedSD)
  }
}
