import { Provider } from '@nestjs/common'
import { DidResolver, DocumentLoader, GaiaXSignatureVerifier } from '@gaia-x/json-web-signature-2020'

export class GaiaXSignatureVerifierProvider {
  static create(): Provider {
    return {
      provide: GaiaXSignatureVerifier,
      inject: [DidResolver, 'documentLoader'],
      useFactory: (didResolver: DidResolver, documentLoader: DocumentLoader) => {
        return new GaiaXSignatureVerifier({
          safe: false,
          documentLoader,
          didResolver
        })
      }
    }
  }
}
