import { Provider } from '@nestjs/common'
import { OfflineDocumentLoaderBuilder } from '@gaia-x/json-web-signature-2020'
import jsonld from 'jsonld'
import TrustFrameworkContext from '../../contexts/trustframework_context.json'

export class DocumentLoaderProvider {
  static create(): Provider {
    return {
      provide: 'documentLoader',
      useFactory: () => {
        if (process.env.WEB_DOCUMENT_LOADER === 'true') {
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
