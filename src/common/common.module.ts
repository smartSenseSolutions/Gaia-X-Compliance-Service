import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantContentValidationService } from '../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from '../service-offering/services/content-validation.service'
import { SignatureService, ShaclService, SelfDescriptionService, RegistryService, ProofService } from './services'
import { CommonController } from './common.controller'
@Module({
  imports: [HttpModule],
  controllers: [CommonController],
  providers: [
    ProofService,
    ShaclService,
    SelfDescriptionService,
    SignatureService,
    ParticipantContentValidationService,
    ServiceOfferingContentValidationService,
    RegistryService
  ],
  exports: [ShaclService, ServiceOfferingContentValidationService, ProofService, SignatureService, RegistryService, SelfDescriptionService]
})
export class CommonModule {}
