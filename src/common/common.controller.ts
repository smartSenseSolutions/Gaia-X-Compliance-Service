import { ConflictException, Controller, HttpStatus, Post, Query, UseInterceptors } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiProduces, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import DataResource from '../tests/fixtures/data-resource.json'
import InstantiatedVirtualResource from '../tests/fixtures/instantiated-virtual-resource.json'
import LegitimateInterest from '../tests/fixtures/legitimate-interest.json'
import ParticipantVP from '../tests/fixtures/participant-vp.json'
import PhysicalResource from '../tests/fixtures/physical-resource.json'
import ServiceAccessPoint from '../tests/fixtures/service-access-point.json'
import ServiceOfferingWithResourceVP from '../tests/fixtures/service-offering-and-ressources-vp.json'
import ServiceOfferingLabelLevel1 from '../tests/fixtures/service-offering-label-level-1.json'
import ServiceOfferingVP from '../tests/fixtures/service-offering-vp.json'
import SOTsAndCs from '../tests/fixtures/so-tsandcs.json'
import SoftwareResource from '../tests/fixtures/software-resource.json'
import TermsAndConditionsVP from '../tests/fixtures/terms-and-conditions-vp.json'
import VirtualResource from '../tests/fixtures/virtual-resource.json'
import { ConversionInterceptor } from './conversion/conversion.interceptor'
import { JWTBody } from './decorators/jwt.decorator'
import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from './dto'
import { ProofService } from './services'
import { VerifiablePresentationValidationService } from './services/verifiable-presentation-validation.service'

const VPExample = {
  participant: { summary: 'Participant', value: ParticipantVP },
  service: { summary: 'Service Offering', value: ServiceOfferingVP },
  serviceLabelLevel1: { summary: 'Service Offering Label Level 1', value: ServiceOfferingLabelLevel1 },
  termsAndConditions: { summary: 'Terms and Conditions', value: TermsAndConditionsVP },
  serviceWithResources: {
    summary: 'ServiceOffering with Resources',
    value: ServiceOfferingWithResourceVP
  },
  sOTermsAndConditions: { summary: 'SOTermsAndConditions example', value: SOTsAndCs },
  dataResource: { summary: 'DataResource example', value: DataResource },
  physicalResource: { summary: 'PhysicalResource example', value: PhysicalResource },
  softwareResource: { summary: 'SoftwareResource example', value: SoftwareResource },
  virtualResource: { summary: 'VirtualResource example', value: VirtualResource },
  legitimateInterest: { summary: 'LegitimateInterest example', value: LegitimateInterest },
  serviceAccessPoint: { summary: 'ServiceAccessPoint example', value: ServiceAccessPoint },
  instantiatedVirtualResource: { summary: 'InstantiatedVirtualResource example', value: InstantiatedVirtualResource }
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

    return this.proofService.createComplianceCredential(vp, vcid)
  }

  constructor(
    private readonly proofService: ProofService,
    private readonly verifiablePresentationValidationService: VerifiablePresentationValidationService
  ) {}
}
