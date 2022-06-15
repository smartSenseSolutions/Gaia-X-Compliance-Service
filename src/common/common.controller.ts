import { Body, Controller, HttpStatus, Post, Res, BadRequestException } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SelfDescriptionService } from './services/selfDescription.service'
import { SignatureService } from './services/signature.service'
import { SelfDescriptionCredentialDto, WrappedParticipantSelfDescriptionDto } from '../participant/dto/participant-sd.dto'
import { Response } from 'express'
import { ProofService } from './services/proof.service'

const credentialType = 'Common'
@ApiTags(credentialType)
@Controller({ path: '', version: '1' })
export class CommonController {
  constructor(
    private readonly selfDescriptionService: SelfDescriptionService,
    private readonly signatureService: SignatureService,
    private readonly proofService: ProofService
  ) { }

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
    const validProof: boolean = await this.proofService.verify(selfDescriptionCredential)

    if (!validProof) {
      return response.sendStatus(HttpStatus.BAD_REQUEST)
    }

    const type: string = selfDescriptionCredential.selfDescription['@type']
    let validationResult = null

    switch (type) {
      case 'gx-participant:LegalPerson':
        validationResult = await this.selfDescriptionService.validateSelfDescription(selfDescriptionCredential)
        break
      case 'gx-service-offering-experimental:ServiceOfferingExperimental':
        validationResult = await this.selfDescriptionService.validateSelfDescription(selfDescriptionCredential)
        break
      default:
        throw new BadRequestException('Provided type for Self Description is not supported')
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
  async normalizeParticipantRaw(@Body() selfDescriptionCredential: WrappedParticipantSelfDescriptionDto, @Res() response: Response) {
    const normalizedSD = await this.signatureService.normalize(selfDescriptionCredential.selfDescription)

    return response.status(normalizedSD !== '' ? HttpStatus.OK : HttpStatus.BAD_REQUEST).send(normalizedSD)
  }
}
