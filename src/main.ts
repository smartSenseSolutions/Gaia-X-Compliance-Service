import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { name, version, description } from '../package.json'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('/api')

  const config = new DocumentBuilder().setTitle(name).setDescription(description).setVersion(version).build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-docs', app, document)

  await app.listen(3000)
}
bootstrap()
