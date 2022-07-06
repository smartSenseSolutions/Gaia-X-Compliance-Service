import { CommonModule } from '../common/common.module'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantContentValidationService } from './services/content-validation.service'
import { ParticipantController } from './participant.controller'
@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ParticipantController],
  providers: [ParticipantContentValidationService]
})
export class ParticipantModule {}
