import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantController } from './participant.controller'
import { SignatureService } from '../common/services/signature.service'
import { ParticipantService } from './services/participant.service'
import { CommonModule } from '../common/common.module'
import { ParticipantContentValidationService } from './services/content-validation.service'
import { ProofService } from '../common/services/proof.service'
import { RegistryService } from '../common/services/registry.service'

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ParticipantController],
  providers: [ParticipantService, ProofService, RegistryService, ParticipantContentValidationService, SignatureService],
  exports: [ParticipantService, SignatureService, ParticipantContentValidationService]
})
export class ParticipantModule { }
