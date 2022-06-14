import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ServiceOfferingController } from './service-offering.controller'
import { SignatureService } from '../common/services/signature.service'
import { CommonModule } from '../common/common.module'
import { ServiceOfferingContentValidationService } from './services/content-validation.service'
import { ParticipantContentValidationService } from '../participant/services/content-validation.service'
import { ProofService } from '../common/services/proof.service'
import { RegistryService } from '../common/services/registry.service'
import { SelfDescriptionService } from '../common/services/selfDescription.service'

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ServiceOfferingController],
  providers: [
    ServiceOfferingContentValidationService,
    SignatureService,
    ParticipantContentValidationService,
    ProofService,
    RegistryService,
    SelfDescriptionService
  ],
  exports: [SignatureService, ServiceOfferingContentValidationService]
})
export class ServiceOfferingModule {}
