import { Provider } from '@nestjs/common'
import { DocumentLoader, GaiaXSignatureSigner } from '@gaia-x/json-web-signature-2020'
import { KeyLike } from 'jose'
import { getDidWeb, X509_VERIFICATION_METHOD_NAME } from '../utils'

export class GaiaXSignatureSignerProvider {
  static create(): Provider {
    return {
      inject: ['privateKey', 'documentLoader'],
      provide: GaiaXSignatureSigner,
      useFactory: (privateKey: KeyLike, documentLoader: DocumentLoader) => {
        return new GaiaXSignatureSigner({
          documentLoader,
          safe: false,
          privateKey: privateKey,
          privateKeyAlg: process.env.PRIVATE_KEY_ALG ?? 'PS256',
          verificationMethod: `${getDidWeb()}#${X509_VERIFICATION_METHOD_NAME}`
        })
      }
    }
  }
}
