import { FactoryProvider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentLoader, OfflineDocumentLoaderBuilder } from '@gaia-x/json-web-signature-2020'
import jsonld from 'jsonld'
import TrustFrameworkContext from '../../contexts/trustframework_context.json'

export class DocumentLoaderProvider {
  static create(): FactoryProvider<DocumentLoader> {
    return {
      provide: 'documentLoader',
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DocumentLoader => {
        if (configService.get<string>('WEB_DOCUMENT_LOADER') === 'true') {
          return new OfflineDocumentLoaderBuilder()
            .addContext(
              'https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#',
              TrustFrameworkContext
            )
            .build()
        }

        return jsonld.documentLoader
      }
    }
  }
}
