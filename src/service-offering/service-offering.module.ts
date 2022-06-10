import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ServiceOfferingController } from './service-offering.controller'
import { SignatureService } from '../common/services/signature.service'
import { ServiceOfferingService } from './services/service-offering.service'
import { CommonModule } from '../common/common.module'
import { ServiceOfferingContentValidationService } from './services/content-validation.service'
import { ParticipantService } from '../participant/services/participant.service'
import { ParticipantContentValidationService } from '../participant/services/content-validation.service'
import { ProofService } from '../common/services/proof.service'
import { RegistryService } from '../common/services/registry.service'

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ServiceOfferingController],
  providers: [
    ServiceOfferingService,
    ServiceOfferingContentValidationService,
    SignatureService,
    ParticipantService,
    ParticipantContentValidationService,
    ProofService, 
    RegistryService
  ],
  exports: [ServiceOfferingService, SignatureService, ServiceOfferingContentValidationService]
})
export class ServiceOfferingModule { }
