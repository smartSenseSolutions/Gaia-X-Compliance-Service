import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { RequestMethod } from '@nestjs/common'
import { setupSwagger } from './common/swagger'
import { createDidDocument } from './common/utils/did.util'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('/api/', {
    exclude: [{ path: '/', method: RequestMethod.GET }]
  })
  setupSwagger(app)

  createDidDocument()

  app.enableCors()
  await app.listen(process.env.PORT || 3000)
}
bootstrap()
