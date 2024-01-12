import { Module } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { OpenIdController } from './controller/open-id.controller'

@Module({
  imports: [CommonModule],
  controllers: [OpenIdController]
})
export class OpenIdModule {}
