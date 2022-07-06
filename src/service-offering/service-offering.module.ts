import { CommonModule } from '../common/common.module'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantContentValidationService } from '../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from './services/content-validation.service'
import { ServiceOfferingController } from './service-offering.controller'
import { SignatureService } from '../common/services/signature.service'

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ServiceOfferingController],
  providers: [ServiceOfferingContentValidationService, SignatureService, ParticipantContentValidationService],
  exports: [ServiceOfferingContentValidationService]
})
export class ServiceOfferingModule {}
