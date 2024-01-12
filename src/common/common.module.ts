import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantContentValidationService } from '../participant/services/participant-content-validation.service'
import { ServiceOfferingContentValidationService } from '../service-offering/services/service-offering-content-validation.service'
import { ServiceOfferingLabelLevelValidationService } from '../service-offering/services/service-offering-label-level-validation.service'
import { CommonController } from './common.controller'
import { ConversionModule } from './conversion/conversion.module'
import { ProofService, RegistryService, ShaclService, SignatureService, TimeService } from './services'
import { TrustFramework2210ValidationService } from './services/tf2210/trust-framework-2210-validation.service'
import { VcQueryService } from './services/vc-query.service'
import { VerifiablePresentationValidationService } from './services/verifiable-presentation-validation.service'

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
    ServiceOfferingLabelLevelValidationService,
    TimeService,
    TrustFramework2210ValidationService,
    VcQueryService,
    VerifiablePresentationValidationService
  ],
  exports: [ProofService, RegistryService, ShaclService, SignatureService, VerifiablePresentationValidationService]
})
export class CommonModule {}
