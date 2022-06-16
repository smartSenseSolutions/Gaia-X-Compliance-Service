import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiVerifyResponse } from '../common/decorators'
import { Response } from 'express'
import { VerifiableSelfDescriptionDto } from '../participant/dto/participant-sd.dto'
import { SignedServiceOfferingSelfDescriptionDto } from './dto/service-offering-sd.dto'
import { VerifyServiceOfferingDto } from './dto/verify-service-offering.dto'
import { SDParserPipe } from '../common/pipes/sd-parser.pipe'
import { UrlSDParserPipe } from '../common/pipes/url-sd-parser.pipe'
import { SelfDescriptionService } from '../common/services/selfDescription.service'
import { SignedSelfDescriptionDto } from '../common/dto/self-description.dto'

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
  async verifyParticipant(@Body(UrlSDParserPipe) serviceOfferingSelfDescription: SignedSelfDescriptionDto, @Res() response: Response) {
    this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription, response)
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Service Offering Self Description' })
  @ApiBody({
    type: VerifiableSelfDescriptionDto
  })
  async verifyParticipantRaw(@Body(SDParserPipe) serviceOfferingSelfDescription: SignedSelfDescriptionDto, @Res() response: Response) {
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
