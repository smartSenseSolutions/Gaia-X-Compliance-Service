import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ShaclService } from './services/shacl.service'
import { CommonController } from './common.controller'
import { ParticipantService } from '../participant/services/participant.service'
import { ParticipantContentValidationService } from '../participant/services/content-validation.service'
import { SignatureService } from './services/signature.service'
import { ServiceOfferingService } from '../service-offering/services/service-offering.service'
import { ServiceOfferingContentValidationService } from '../service-offering/services/content-validation.service'
import { ProofService } from './services/proof.service'
import { RegistryService } from './services/registry.service'
@Module({
  imports: [HttpModule],
  controllers: [CommonController],
  providers: [
    ProofService,
    ShaclService,
    ServiceOfferingService,
    ServiceOfferingContentValidationService,
    SignatureService,
    ParticipantService,
    ParticipantContentValidationService,
    RegistryService
  ],
  exports: [ShaclService]
})
export class CommonModule { }
