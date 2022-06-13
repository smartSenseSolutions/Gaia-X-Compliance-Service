import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiVerifyResponse } from '../common/decorators'
import { ServiceOfferingService } from './services/service-offering.service'
import { ServiceOfferingSDParserPipe } from './pipes/service-offering-sd-parser.pipe'
import { Response } from 'express'
import { VerifiableSelfDescriptionDto } from '../participant/dto/participant-sd.dto'
import { SignedServiceOfferingSelfDescriptionDto } from './dto/service-offering-sd.dto'
import { VerifyServiceOfferingDto } from './dto/verify-service-offering.dto'

const credentialType = 'Service Offering (experimental)'
@ApiTags(credentialType)
@Controller({ path: 'service-offering', version: '1' })
export class ServiceOfferingController {
  constructor(private readonly serviceOfferingService: ServiceOfferingService) {}
  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiBody({
    type: VerifyServiceOfferingDto
  })
  @ApiOperation({ summary: 'Validate a Service Offering Self Description from a URL' })
  async verifyParticipant(
    @Body(ServiceOfferingSDParserPipe) participantSelfDescription: SignedServiceOfferingSelfDescriptionDto,
    @Res() response: Response
  ) {
    this.verifySignedServiceOfferingSD(participantSelfDescription, response)
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Service Offering Self Description' })
  @ApiBody({
    type: VerifiableSelfDescriptionDto
  })
  async verifyParticipantRaw(@Body(ServiceOfferingSDParserPipe) serviceOfferingSelfDescription: any, @Res() response: Response) {
    this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription, response)
  }

  private async verifySignedServiceOfferingSD(participantSelfDescription: SignedServiceOfferingSelfDescriptionDto, response: Response) {
    try {
      const validationResult = await this.serviceOfferingService.validate(participantSelfDescription)

      response.status(validationResult.conforms ? HttpStatus.OK : HttpStatus.CONFLICT).send(validationResult)
    } catch (error) {
      response.sendStatus(HttpStatus.BAD_REQUEST)
    }
  }
}
