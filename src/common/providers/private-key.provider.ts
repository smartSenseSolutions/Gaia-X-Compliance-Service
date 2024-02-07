import { Provider } from '@nestjs/common'
import * as jose from 'jose'
import crypto, { KeyObject } from 'crypto'
import { KeyLike } from 'jose'

export class PrivateKeyProvider {
  static create(): Provider {
    return {
      provide: 'privateKey',
      useFactory: async (): Promise<KeyLike | KeyObject> => {
        return process.env.privateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----')
          ? crypto.createPrivateKey(process.env.privateKey)
          : await jose.importPKCS8(process.env.privateKey, 'PS256')
      }
    }
  }
}
