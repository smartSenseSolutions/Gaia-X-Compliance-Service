import { ApiBody, ApiOperation, ApiProduces, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ConflictException, Controller, HttpStatus, Post, Query, UseInterceptors } from '@nestjs/common'
import { SignatureService } from './services'
import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from './dto'
import ParticipantVP from '../tests/fixtures/participant-vp.json'
import ServiceOfferingVP from '../tests/fixtures/service-offering-vp.json'
import { VerifiablePresentationValidationService } from './services/verifiable-presentation-validation.service'
import { JWTBody } from './decorators/jwt.decorator'
import { ConversionInterceptor } from './conversion/conversion.interceptor'

const VPExample = {
  participant: { summary: 'Participant', value: ParticipantVP },
  service: { summary: 'Service Offering', value: ServiceOfferingVP }
}

@ApiTags('credential-offer')
@Controller({ path: '/api/' })
export class CommonController {
  @ApiProduces('application/json', 'application/vc+jwt')
  @ApiResponse({
    status: 201,
    description: 'Successfully signed VC.',
    schema: {}
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
    examples: VPExample,
    description: 'A VerifiablePresentation in JSON-LD or JWT format'
  })
  @ApiQuery({
    name: 'vcid',
    type: 'string',
    description: 'Output VC ID. Optional. Should be url_encoded if an URL',
    required: false,
    example: 'https://storage.gaia-x.eu/credential-offers/b3e0a068-4bf8-4796-932e-2fa83043e203'
  })
  @Post('credential-offers')
  @UseInterceptors(ConversionInterceptor)
  async issueVC(
    @JWTBody() vp: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>>,
    @Query('vcid') vcid?: string
  ): Promise<string | VerifiableCredentialDto<ComplianceCredentialDto>> {
    const validationResult = await this.verifiablePresentationValidationService.validateVerifiablePresentation(vp)
    if (!validationResult.conforms) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult
        },
        error: 'Conflict'
      })
    }
    return this.signatureService.createComplianceCredential(vp, vcid)
  }

  constructor(
    private readonly signatureService: SignatureService,
    private readonly verifiablePresentationValidationService: VerifiablePresentationValidationService
  ) {}
}
