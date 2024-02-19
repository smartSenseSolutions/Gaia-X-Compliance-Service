import { Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentLoader, GaiaXSignatureSigner } from '@gaia-x/json-web-signature-2020'
import { KeyLike } from 'jose'
import { getDidWeb, X509_VERIFICATION_METHOD_NAME } from '../utils'

export class GaiaXSignatureSignerProvider {
  static create(): Provider {
    return {
      inject: ['privateKey', 'documentLoader', ConfigService],
      provide: GaiaXSignatureSigner,
      useFactory: (privateKey: KeyLike, documentLoader: DocumentLoader, configService: ConfigService) => {
        return new GaiaXSignatureSigner({
          documentLoader,
          safe: false,
          privateKey: privateKey,
          privateKeyAlg: configService.get<string>('PRIVATE_KEY_ALG', 'PS256'),
          verificationMethod: `${getDidWeb()}#${X509_VERIFICATION_METHOD_NAME}`
        })
      }
    }
  }
}
