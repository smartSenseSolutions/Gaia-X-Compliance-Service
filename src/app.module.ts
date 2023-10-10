import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { AppController } from './app.controller'
import { CommonModule } from './common/common.module'
import { ConfigModule } from './config/config.module'

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src/static'),
      serveRoot: process.env['APP_PATH'] ? process.env['APP_PATH'] : '/',
      exclude: ['/api*']
    }),
    CommonModule
  ],
  controllers: [AppController]
})
export class AppModule {}
