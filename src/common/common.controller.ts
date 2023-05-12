import { ApiBody, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger'
import { Body, ConflictException, Controller, HttpStatus, InternalServerErrorException, Post, UsePipes, Query, Logger } from '@nestjs/common'
import { ProofService, SelfDescriptionService, SignatureService } from './services'
import { ParticipantSelfDescriptionDto } from '../participant/dto'
import { ServiceOfferingSelfDescriptionDto } from '../service-offering/dto'
import {
  ComplianceCredentialDto,
  CredentialSubjectDto,
  SignedSelfDescriptionDto,
  ValidationResultDto,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto,
  VerifiablePresentationDto
} from './dto'
import ParticipantSD from '../tests/fixtures/participant-sd.json'
import ServiceOfferingExperimentalSD from '../tests/fixtures/service-offering-sd.json'
import ParticipantVP from '../tests/fixtures/participant-vp.json'
import ServiceOfferingVP from '../tests/fixtures/service-offering-vp.json'
import { JoiValidationPipe, SDParserPipe } from './pipes'
import { ParticipantSelfDescriptionSchema } from './schema/selfDescription.schema'
import { CredentialTypes } from './enums'
import { getTypeFromSelfDescription } from './utils'
import { ApiVerifyResponse } from './decorators'

const credentialType = CredentialTypes.common
const  logger = new Logger(SelfDescriptionService.name)
const commonSDExamples = {
  participant: { summary: 'Participant SD Example', value: ParticipantSD.selfDescriptionCredential },
  service: {
    summary: 'Service Offering Experimental SD Example',
    value: ServiceOfferingExperimentalSD.selfDescriptionCredential
  }
}
const commonFullExample = {
  participant: { summary: 'Participant SD Example', value: ParticipantSD },
  service: { summary: 'Service Offering Experimental SD Example', value: ServiceOfferingExperimentalSD }
}

const VPExample = {
  participant: { summary: 'Participant VP Example', value: ParticipantVP },
  service: { summary: 'Service Offering Experimental VP Example', value: ServiceOfferingVP }
}

@ApiTags(credentialType)
@Controller({ path: '/api/' })
export class CommonController {
  constructor(
    private readonly selfDescriptionService: SelfDescriptionService,
    private readonly signatureService: SignatureService,
    private readonly proofService: ProofService
  ) {}

  @ApiResponse({
    status: 201,
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
    type: VerifiableCredentialDto,
    examples: commonSDExamples
  })
  @ApiOperation({ summary: 'Canonize, hash and sign a valid Self Description (Actual Compliance credential issuance method)' })
  @UsePipes(new JoiValidationPipe(ParticipantSelfDescriptionSchema))
  @Post('sign')
  async signSelfDescription(
    @Body() verifiableSelfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
  ): Promise<{ complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> }> {
    await this.proofService.validate(JSON.parse(JSON.stringify(verifiableSelfDescription)))
    const type: string = getTypeFromSelfDescription(verifiableSelfDescription)
    await this.selfDescriptionService.validateSelfDescription(verifiableSelfDescription, type)
    return await this.signatureService.createComplianceCredential(verifiableSelfDescription)
  }

  @Post('normalize')
  @ApiResponse({
    status: 201,
    description: 'Normalized Self Description.'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.'
  })
  @ApiOperation({ summary: 'Normalize (canonize) a Self Description using URDNA2015' })
  @ApiBody({
    type: VerifiableCredentialDto,
    examples: commonSDExamples
  })
  async normalizeSelfDescriptionRaw(
    @Body() selfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
  ): Promise<string> {
    return await this.signatureService.normalize(selfDescription)
  }

  @ApiResponse({
    status: 201,
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
  @ApiOperation({
    summary:
      'Canonize, hash and sign a valid Self Description (Proposal: Verify shape and content according to trust framework before emitting Compliance credential)'
  })
  @ApiBody({
    type: VerifiablePresentationDto,
    examples: VPExample
  })
  @ApiQuery({ name: 'signedWithWalt', enum: ["true", "false"], required: false })
  @Post('vc-issuance')
  async vc_issuance(@Body() vp: any, @Query() query:any ): Promise<{ complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> }> {
    let waltid = false
    logger.log("Incoming Verification for VP with credential ID", vp.verifiableCredential[0].id)
    let { signedWithWalt } = query
    if(signedWithWalt == 'true') {
      waltid = true
    }
    await this.proofService.validate(JSON.parse(JSON.stringify(vp.verifiableCredential[0])), waltid=waltid)
    const type = getTypeFromSelfDescription(vp.verifiableCredential[0])
    const _SDParserPipe = new SDParserPipe(type)
    const verifiableSelfDescription_compliance: VerifiableSelfDescriptionDto<CredentialSubjectDto> = {
      selfDescriptionCredential: { ...vp.verifiableCredential[0] }
    }
    const validationResult = await this.selfDescriptionService.validate(_SDParserPipe.transform(verifiableSelfDescription_compliance))
    if (!validationResult.conforms) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult
        },
        error: 'Conflict'
      })
    }
    return await this.signatureService.createComplianceCredential(vp.verifiableCredential[0])
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiOperation({ summary: 'Validate a Self Description' })
  @ApiExtraModels(
    VerifiableSelfDescriptionDto,
    VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>,
    ServiceOfferingSelfDescriptionDto
  )
  @ApiBody({
    type: SignedSelfDescriptionDto,
    examples: commonFullExample
  })
  async verifyRaw(
    @Body()
    SelfDescription: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>
  ): Promise<ValidationResultDto> {
    const type = getTypeFromSelfDescription(SelfDescription.selfDescriptionCredential)
    const _SDParserPipe = new SDParserPipe(type)
    const verifiableSelfDescription_compliance: SignedSelfDescriptionDto<CredentialSubjectDto> = _SDParserPipe.transform(SelfDescription)
    try {
      const validationResult: ValidationResultDto = await this.selfDescriptionService.verify(verifiableSelfDescription_compliance)
      if (!validationResult.conforms) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: {
            ...validationResult
          },
          error: 'Conflict'
        })
      }
      return validationResult
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      }
      if (error.status == 409) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: error.response.message,
          error: 'Conflict'
        })
      } else {
        throw new InternalServerErrorException()
      }
    }
  }
}
