import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantContentValidationService } from './services/content-validation.service'
import { ParticipantController } from './participant.controller'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ParticipantController],
  providers: [ParticipantContentValidationService],
  exports: [ParticipantContentValidationService]
})
export class ParticipantModule {}
