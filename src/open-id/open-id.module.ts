import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import PrivateKeyProvider from '../provider/private-key.provider'
import { OpenIdVpController } from './controller/open-id-vp.controller'

@Module({
  imports: [CommonModule, CacheModule.register()],
  controllers: [OpenIdVpController],
  providers: [PrivateKeyProvider]
})
export class OpenIdModule {}
