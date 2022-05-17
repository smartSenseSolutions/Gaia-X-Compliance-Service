import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { RequestMethod } from '@nestjs/common'
import { setupSwagger } from './common/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('/api/v1', {
    exclude: [{ path: '/', method: RequestMethod.GET }]
  })

  setupSwagger(app)

  app.enableCors()
  await app.listen(3000)
}
bootstrap()
