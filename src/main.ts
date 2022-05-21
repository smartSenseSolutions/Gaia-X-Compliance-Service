import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { RequestMethod } from '@nestjs/common'
import { setupSwagger } from './common/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('/api/', {
    exclude: [{ path: '/', method: RequestMethod.GET }]
  })

  app.enableVersioning()
  setupSwagger(app)

  app.enableCors()
  await app.listen(3000)
}
bootstrap()
