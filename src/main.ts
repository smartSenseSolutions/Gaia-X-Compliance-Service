import { NestFactory } from '@nestjs/core'
import got from 'got'
import fs from 'node:fs'
import { AppModule } from './app.module'
import { setupSwagger } from './common/swagger'

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
  Error.stackTraceLimit = Infinity
  app.setGlobalPrefix(`${appPath}/`)
  setupSwagger(app)
  app.enableCors()
  app.enableShutdownHooks()
  try {
    const fd = fs.openSync('/dev/attestation/user_report_data', 'r+')
    fs.writeSync(fd, 'gx-compliance')
    const fdQuote = fs.openSync('/dev/attestation/report', 'r')
    const quote = fs.readFileSync(fdQuote)
    console.log(quote.toString('utf-8'))
    console.log(quote.toString('ascii'))
    console.log(quote.toString('base64'))
    console.log(quote.toString('hex'))
  } catch (error) {
    console.log('SGX Quote unavailable')
  }
  await console.log(got.get('https://registry.lab.gaia-x.eu/v1/docs').json())
  await app.listen(process.env.PORT || 3000)
}

bootstrap()
