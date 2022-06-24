import { Body, Controller, Post, BadRequestException, ConflictException } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SelfDescriptionService } from './services/selfDescription.service'
import { SignatureService } from './services/signature.service'
import { ParticipantSelfDescriptionDto } from '../participant/dto/participant-sd.dto'
import { ProofService } from './services/proof.service'
import { VerifiableCredentialDto } from './dto/credential-meta.dto'
import { ServiceOfferingSelfDescriptionDto } from '../service-offering/dto/service-offering-sd.dto'
import ParticipantSD from '../tests/fixtures/participant-sd.json'
import ServiceOfferingExperimentalSD from '../tests/fixtures/service-offering-sd.json'
import { ComplianceCredentialDto } from './dto/compliance-credential.dto'
import { ValidationResult } from 'joi'
import { ValidationResultDto } from './dto/validation-result.dto'

const credentialType = 'Common'

const commonSDExamples = {
  participant: { summary: 'Participant SD Example', value: ParticipantSD.selfDescriptionCredential },
  service: { summary: 'Service Offering Experimental SD Example', value: ServiceOfferingExperimentalSD.selfDescriptionCredential }
}
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
    type: VerifiableCredentialDto,
    examples: commonSDExamples
  })
  @ApiOperation({ summary: 'Canonize, hash and sign a valid Self Description' })
  @Post('sign')
  async signSelfDescription(
    @Body() verifiableSelfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
  ): Promise<{ complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> }> {
    verifiableSelfDescription['@context'] = { credentialSubject: '@nest' } // TODO extract to common function

    const isValidProof: boolean = await this.proofService.verify(verifiableSelfDescription) // TODO align wording here 'verify' and 'validate'
    if (!isValidProof) throw new BadRequestException('Provided proof does not match Self Descriptions.')

    const SUPPORTED_TYPES = ['LegalPerson', 'ServiceOfferingExperimental'] // TODO extract to common const
    const types = (verifiableSelfDescription as any)['@type']
    const type: 'LegalPerson' | 'ServiceOfferingExperimental' = types.find(t => t !== 'VerifiableCredential') // TODO extract to common utils
    if (!SUPPORTED_TYPES.includes(type)) throw new BadRequestException('Provided type for Self Description is not supported')

    const validationResult: ValidationResultDto = await this.selfDescriptionService.validateSelfDescription(verifiableSelfDescription, type)
    if (!validationResult) throw new BadRequestException('Provided Self Description cannot be validated.') // TODO remove once validateSelfDescription is rewritten
    if (!validationResult?.conforms) throw new ConflictException({ shape: validationResult.shape, content: validationResult.content }) // TODO match with the other error response objects

    const complianceCredential = await this.signatureService.createComplianceCredential(
      verifiableSelfDescription,
      verifiableSelfDescription.proof.jws
    ) // TODO create new return type

    return complianceCredential
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
    type: VerifiableCredentialDto,
    examples: commonSDExamples
  })
  async normalizeSelfDescriptionRaw(
    @Body() selfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
  ): Promise<string> {
    selfDescription['@context'] = { credentialSubject: '@nest' } // TODO extract to common function
    const normalizedSD = await this.signatureService.normalize(selfDescription)

    if (normalizedSD === '') throw new BadRequestException('Provided input is not a valid Self Description.')

    return normalizedSD
  }
}
