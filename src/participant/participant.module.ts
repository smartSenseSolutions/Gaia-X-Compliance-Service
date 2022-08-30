import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantContentValidationService2 } from './services/content-validation.service'
import { ParticipantController } from './participant.controller'
import { ParticipantModule as ParticipantModule2204 } from '../../participant/participant.module'
import { CommonModule2 } from '../common/common.module'

@Module({
  imports: [HttpModule, CommonModule2, ParticipantModule2204],
  controllers: [ParticipantController],
  providers: [ParticipantContentValidationService2],
  exports: [ParticipantContentValidationService2]
})
export class ParticipantModule {}
