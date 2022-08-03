import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'
import { name, description } from '../../package.json'
import { writeFileSync } from 'fs'
import * as path from 'path'
import { ParticipantModule } from '../participant/participant.module'
import { ServiceOfferingModule } from '../service-offering/service-offering.module'
import { CommonModule } from './common.module'
import { CommonModule2 as CommonModule2206 } from '../2206/common/common.module'
import { ParticipantModule as ParticipantModule2206 } from '../2206/participant/participant.module'
import { ServiceOfferingModule as ServiceOfferingModule2206 } from '../2206/service-offering/service-offering.module'

export const OPEN_API_DOC_PATH = path.resolve(process.cwd(), 'openapi.json')

export const SWAGGER_UI_PATH = 'docs'

const options = {
  tagsSorter: 'alpha',
  operationsSorter: 'alpha',
  customCss: `.curl-command { display: none } .swagger-ui .topbar { display: none }; `
}

const versions = [
  {
    number: '2206',
    latest: true,
    includedModules: [CommonModule2206, ParticipantModule2206, ServiceOfferingModule2206]
  },
  {
    number: '2204',
    includedModules: [CommonModule, ParticipantModule, ServiceOfferingModule]
  }
]

export function setupSwagger(app: INestApplication) {
  for (const version of versions) {
    const config = new DocumentBuilder().setTitle(name).setDescription(description).setVersion(version.number).build()

    const document = SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: false, include: version.includedModules })

    const versionPath = `v${version.number.split('.')[0]}`

    writeFileSync(version.latest ? OPEN_API_DOC_PATH : OPEN_API_DOC_PATH.replace('.json', `-${versionPath}.json`), JSON.stringify(document), {
      encoding: 'utf8'
    })

    SwaggerModule.setup(`${SWAGGER_UI_PATH}/${versionPath}`, app, document, options)

    if (version.latest) SwaggerModule.setup(SWAGGER_UI_PATH, app, document, options)
  }
}
