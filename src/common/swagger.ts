import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { writeFileSync } from 'fs'
import * as path from 'path'
import { name, version, description } from '../../package.json'

export const openApiDocumentPath = path.resolve(process.cwd(), 'openapi.json')

const style = {
  customCss: `.swagger-ui .topbar { display: none }`
}

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder().setTitle(name).setDescription(description).setVersion(version).addTag('Participant').addServer('v1').build()

  const document = SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: true })
  writeFileSync(openApiDocumentPath, JSON.stringify(document), { encoding: 'utf8' })

  SwaggerModule.setup('api', app, document, style)
}
