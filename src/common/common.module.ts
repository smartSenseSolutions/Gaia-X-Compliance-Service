import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ShaclService } from './services/shacl.service'
import { CommonController } from './common.controller'
import { ParticipantContentValidationService } from '../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from '../service-offering/services/content-validation.service'
import { SignatureService } from './services/signature.service'
import { ProofService } from './services/proof.service'
import { RegistryService } from './services/registry.service'
import { SelfDescriptionService } from './services/selfDescription.service'

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
  exports: [ShaclService, ServiceOfferingContentValidationService]
})
export class CommonModule {}
