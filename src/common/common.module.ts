import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ProofService, RegistryService, ShaclService, SignatureService, TimeService } from './services'
import { CommonController } from './common.controller'
import { VerifiablePresentationValidationService } from './services/verifiable-presentation-validation.service'
import { TrustFramework2210ValidationService } from './services/tf2210/trust-framework-2210-validation.service'
import { ParticipantContentValidationService } from '../participant/services/participant-content-validation.service'
import { ServiceOfferingContentValidationService } from '../service-offering/services/service-offering-content-validation.service'
import { ConversionModule } from './conversion/conversion.module'
import { VcQueryService } from './services/vc-query.service'

@Module({
  imports: [HttpModule, ConversionModule],
  controllers: [CommonController],
  providers: [
    ParticipantContentValidationService,
    ProofService,
    ShaclService,
    SignatureService,
    RegistryService,
    ServiceOfferingContentValidationService,
    TimeService,
    TrustFramework2210ValidationService,
    VcQueryService,
    VerifiablePresentationValidationService
  ],
  exports: [ProofService, RegistryService, ShaclService, SignatureService]
})
export class CommonModule {}
