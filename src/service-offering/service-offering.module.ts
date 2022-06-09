import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ServiceOfferingController } from './service-offering.controller'
import { SignatureService } from '../common/services/signature.service'
import { ServiceOfferingService } from './services/service-offering.service'
import { CommonModule } from '../common/common.module'
import { ServiceOfferingContentValidationService } from './services/content-validation.service'

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ServiceOfferingController],
  providers: [ServiceOfferingService, ServiceOfferingContentValidationService, SignatureService],
  exports: [ServiceOfferingService, SignatureService, ServiceOfferingContentValidationService]
})
export class ServiceOfferingModule {}
