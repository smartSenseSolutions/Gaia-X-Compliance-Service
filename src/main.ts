import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { setupSwagger } from './common/swagger'
import { createDidDocument, importCertChain } from './common/utils'
import fs from 'fs'
import overrideDocumentLoader from './utils/static-document-loader'
import jsonld from 'jsonld'
export const appPath = !!process.env['APP_PATH'] ? process.env['APP_PATH'] : ''

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

  app.setGlobalPrefix(`${appPath}/`)
  setupSwagger(app)
  importCertChain()
  await createDidDocument()

  app.enableCors()
  if (process.env.WEB_DOCUMENT_LOADER === 'true') {
    // Do nothing
  } else {
    overrideDocumentLoader(jsonld.documentLoader)
  }
  await app.listen(process.env.PORT || 3000)
}

bootstrap()
