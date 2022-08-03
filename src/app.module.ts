import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { ParticipantModule } from './participant/participant.module'
import { ConfigModule } from '@nestjs/config'
import { CommonModule } from './common/common.module'
import { ServiceOfferingModule } from './service-offering/service-offering.module'
import { ParticipantModule as ParticipantModule2206 } from './2206/participant/participant.module'
import { ServiceOfferingModule as ServiceOfferingModule2206 } from './2206/service-offering/service-offering.module'
import { CommonModule2 as CommonModule2206 } from './2206/common/common.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src/static'),
      exclude: ['/api*']
    }),
    CommonModule,
    ParticipantModule,
    ServiceOfferingModule,
    CommonModule2206,
    ParticipantModule2206,
    ServiceOfferingModule2206
  ]
})
export class AppModule {}
