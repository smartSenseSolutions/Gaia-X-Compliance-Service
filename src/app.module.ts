import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { resolve } from 'path'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ParticipantModule } from './participant/participant.module'
import { ConfigModule } from '@nestjs/config'
import { CommonModule } from './common/common.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true
    }),
    ServeStaticModule.forRoot({
      rootPath: resolve(__dirname, '../src/static'),
      exclude: ['/api*']
    }),
    ParticipantModule,
    CommonModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
