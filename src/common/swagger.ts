import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'
import { name, version, description } from '../../package.json'
import { writeFileSync } from 'fs'
import * as path from 'path'

export const OPEN_API_DOC_PATH = path.resolve(process.cwd(), 'openapi.json')

export const SWAGGER_UI_PATH = 'docs'

const options = {
  tagsSorter: 'alpha',
  operationsSorter: 'alpha',
  customCss: `.curl-command { display: none } .swagger-ui .topbar { display: none }; `
}

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder().setTitle(name).setDescription(description).setVersion(version).addTag('Participant').build()

  const document = SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: false })
  writeFileSync(OPEN_API_DOC_PATH, JSON.stringify(document), { encoding: 'utf8' })

  SwaggerModule.setup(SWAGGER_UI_PATH, app, document, options)
}
