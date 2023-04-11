import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, HttpStatus, Post } from '@nestjs/common'
import { SignatureService } from './services'
import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from './dto'
import ParticipantVP from '../tests/fixtures/participant-vp.json'
import ServiceOfferingVP from '../tests/fixtures/service-offering-vp.json'
import { VerifiablePresentationValidationService } from './services/verifiable-presentation-validation.service'

const VPExample = {
  participant: { summary: 'Participant VP Example', value: ParticipantVP },
  service: { summary: 'TBD - Service Offering Experimental VP Example', value: ServiceOfferingVP }
}

@ApiTags('credential-offer')
@Controller({ path: '/api/' })
export class CommonController {
  constructor(
    private readonly signatureService: SignatureService,
    private readonly verifiablePresentationValidationService: VerifiablePresentationValidationService
  ) {}

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
  @Post('credential-offers')
  async issueVC(
    @Body() vp: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>>
  ): Promise<VerifiableCredentialDto<ComplianceCredentialDto>> {
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
    return await this.signatureService.createComplianceCredential(vp)
  }
}
