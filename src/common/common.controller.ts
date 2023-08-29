import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, HttpStatus, Post, Query, Get, Param, NotFoundException } from '@nestjs/common'
import { SignatureService } from './services'
import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from './dto'
import ParticipantVP from '../tests/fixtures/participant-vp.json'
import ServiceOfferingVP from '../tests/fixtures/service-offering-vp.json'
import { VerifiablePresentationValidationService } from './services/verifiable-presentation-validation.service'
import { VPToken } from './dto/verifiable-presentation-token.dto'
const { init } = require('./utils/tracer')
const api = require('@opentelemetry/api')
init('Controller', 'development') 


const VPExample = {
  participant: { summary: 'Participant', value: ParticipantVP },
  service: { summary: 'Service Offering', value: ServiceOfferingVP }
}
const VCExample = {
  participant: { summary: 'Participant', value: ParticipantVP.verifiableCredential[0] },
  service: { summary: 'Service Offering', value: ServiceOfferingVP.verifiableCredential[0] }
}

@ApiTags('credential-offer')
@Controller({ path: '/api/' })
export class CommonController {
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
    examples: VCExample
  })
  async normalizeSelfDescriptionRaw(@Body() selfDescription: VerifiableCredentialDto<any>): Promise<string> {
    return await this.signatureService.normalize(selfDescription)
  }

  @ApiResponse({
    status: 201,
    description: 'Successfully signed VC.'
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
    summary: 'Check Gaia-X compliance rules and outputs a VerifiableCredentials from your VerifiablePresentation'
  })
  @ApiBody({
    type: VerifiablePresentationDto,
    examples: VPExample
  })
  @ApiQuery({
    name: 'vcid',
    type: 'string',
    description: 'Output VC ID. Optional. Should be url_encoded if an URL',
    required: false,
    example: 'https://storage.gaia-x.eu/credential-offers/b3e0a068-4bf8-4796-932e-2fa83043e203'
  })
  @ApiQuery({ name: 'signedWithWalt', type: 'boolean', required: false })
  @Post('credential-offers')
  async issueVC(
    @Body() vp: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>>,
    @Query('vcid') vcid?: string,
    @Query('signedWithWalt') signedWithWalt?: string
  ): Promise<VerifiableCredentialDto<ComplianceCredentialDto>> {
    const waltid = signedWithWalt === 'true'
    const validationResult = await this.verifiablePresentationValidationService.validateVerifiablePresentation(vp, waltid)
    const activeSpan = api.trace.getSpan(api.context.active())
    activeSpan.addEvent('VC Verification Passed', { randomIndex: 1 })
    if (!validationResult.conforms) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult
        },
        error: 'Conflict'
      })
    }
    console.log('compliance credential emission has started')
    return await this.signatureService.createComplianceCredential(vp, vcid)
  }

  @ApiResponse({
    status: 201,
    description: 'Successfully signed VC.'
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
    summary: 'Check Gaia-X compliance rules and outputs a VerifiableCredentials from your VerifiablePresentation'
  })
  @ApiBody({
    type: VerifiablePresentationDto,
    examples: VPExample
  })
  @ApiQuery({
    name: 'vcid',
    type: 'string',
    description: 'Output VC ID. Optional. Should be url_encoded if an URL',
    required: false,
    example: 'https://storage.gaia-x.eu/credential-offers/b3e0a068-4bf8-4796-932e-2fa83043e203'
  })
  @ApiQuery({ name: 'signedWithWalt', type: 'boolean', required: false })
  @Post('/oidc/credential-offers')
  async issueVCOIDC4CI(
    @Body() payload: VPToken,
    @Query('vcid') vcid?: string,
    @Query('signedWithWalt') signedWithWalt?: string
  ): Promise<VerifiableCredentialDto<ComplianceCredentialDto>> {
    console.log('Credential received via OID4VP')
    const vp: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>> = JSON.parse(payload.vp_token)
    const state = payload.state
    const waltid = signedWithWalt === 'true'
    const validationResult = await this.verifiablePresentationValidationService.validateVerifiablePresentation(vp, waltid)
    if (!validationResult.conforms) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult
        },
        error: 'Conflict'
      })
    }
    console.log('compliance credential emission has started')
    const compliance_credential = await this.signatureService.createComplianceCredential(vp, vcid)
    this.verifiablePresentationValidationService.setComplianceCredential(state, compliance_credential)
    return compliance_credential
  }

  @Get('/oidc/credential-offers/:state')
  async getVC(@Param('state') state: string): Promise<VerifiableCredentialDto<ComplianceCredentialDto>> {
    const complianceCredential = this.verifiablePresentationValidationService.getComplianceCredential(state)
    if (!complianceCredential) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No credential found, state is invalid or expired'
      })
    } else {
      return complianceCredential
    }
  }

  constructor(
    private readonly signatureService: SignatureService,
    private readonly verifiablePresentationValidationService: VerifiablePresentationValidationService
  ) {}
}
