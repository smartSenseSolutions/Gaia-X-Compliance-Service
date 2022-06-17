import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common'
import { ApiBody, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiVerifyResponse } from '../common/decorators'
import { Response } from 'express'
import { VerifiableSelfDescriptionDto } from '../participant/dto/participant-sd.dto'
import { ServiceOfferingSelfDescriptionDto } from './dto/service-offering-sd.dto'
import { VerifyServiceOfferingDto } from './dto/verify-service-offering.dto'
import { SDParserPipe } from '../common/pipes/sd-parser.pipe'
import { UrlSDParserPipe } from '../common/pipes/url-sd-parser.pipe'
import { SelfDescriptionService } from '../common/services/selfDescription.service'
import { SignedSelfDescriptionDto } from '../common/dto/self-description.dto'
import { getApiVerifyBodySchema } from '../common/utils/api-verify-raw-body-schema.util'
import ServiceOfferingExperimentalSD from '../tests/fixtures/service-offering-sd.json'
import { VerifiableCredentialDto } from '../common/dto/credential-meta.dto'
import { HttpService } from '@nestjs/axios'

const credentialType = 'Service Offering (experimental)'
@ApiTags(credentialType)
@Controller({ path: 'service-offering', version: '1' })
export class ServiceOfferingController {
  constructor(private readonly selfDescriptionService: SelfDescriptionService) {}
  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiBody({
    type: VerifyServiceOfferingDto
  })
  @ApiOperation({ summary: 'Validate a Service Offering Self Description from a URL' })
  async verifyParticipant(
    @Body(new UrlSDParserPipe(new HttpService(), 'ServiceOfferingExperimental')) serviceOfferingSelfDescription: SignedSelfDescriptionDto,
    @Res() response: Response
  ) {
    this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription, response)
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Service Offering Self Description' })
  @ApiExtraModels(VerifiableSelfDescriptionDto, VerifiableCredentialDto, ServiceOfferingSelfDescriptionDto)
  @ApiBody(
    getApiVerifyBodySchema('ServiceOfferingExperimental', {
      service: { summary: 'Service Offering Experimental SD Example', value: ServiceOfferingExperimentalSD }
    })
  )
  async verifyParticipantRaw(
    @Body(new SDParserPipe('ServiceOfferingExperimental')) serviceOfferingSelfDescription: SignedSelfDescriptionDto,
    @Res() response: Response
  ) {
    this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription, response)
  }

  private async verifySignedServiceOfferingSD(serviceOfferingSelfDescription: SignedSelfDescriptionDto, response: Response) {
    try {
      const validationResult = await this.selfDescriptionService.validate(serviceOfferingSelfDescription, true)

      response.status(validationResult.conforms ? HttpStatus.OK : HttpStatus.CONFLICT).send(validationResult)
    } catch (error) {
      response.sendStatus(HttpStatus.BAD_REQUEST)
    }
  }
}
