import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { AppController } from './app.controller'
import { CommonModule } from './common/common.module'
import { ConfigModule } from './config/config.module'
import { LoggerMiddleware } from './logger.middleware'
import { OpenIdModule } from './open-id/open-id.module'

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src/static'),
      serveRoot: process.env['APP_PATH'] ? process.env['APP_PATH'] : '/',
      exclude: ['/api*']
    }),
    CommonModule,
    OpenIdModule
  ],
  controllers: [AppController]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
