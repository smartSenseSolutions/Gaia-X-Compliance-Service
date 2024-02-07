import { Provider } from '@nestjs/common'
import { DidResolver, DocumentLoader, JsonWebSignature2020Verifier } from '@gaia-x/json-web-signature-2020'

export class JsonWebSignature2020VerifierProvider {
  static create(): Provider {
    return {
      provide: JsonWebSignature2020Verifier,
      inject: [DidResolver, 'documentLoader'],
      useFactory: (didResolver: DidResolver, documentLoader: DocumentLoader) => {
        return new JsonWebSignature2020Verifier({
          safe: false,
          documentLoader,
          didResolver
        })
      }
    }
  }
}
