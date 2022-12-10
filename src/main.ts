import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { RequestMethod } from '@nestjs/common'
import { setupSwagger } from './common/swagger'
import { createDidDocument } from './common/utils/did.util'
import fs from 'fs'

async function bootstrap() {
  const httpsOptions =
    process.env.LOCAL_HTTPS === 'true'
      ? {
          key: fs.readFileSync(__dirname + '/secrets/dev-only-https-private-key.pem'),
          cert: fs.readFileSync(__dirname + '/secrets/dev-only-https-public-certificate.pem')
        }
      : {}

  const app = await NestFactory.create(AppModule, {
    httpsOptions: process.env.LOCAL_HTTPS === 'true' ? httpsOptions : undefined
  })

  app.setGlobalPrefix('/api/', {
    exclude: [{ path: '/', method: RequestMethod.GET }]
  })
  setupSwagger(app)

  createDidDocument()

  app.enableCors()
  await app.listen(process.env.PORT || 3000)
}
bootstrap()
