import { FactoryProvider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as jose from 'jose'
import crypto, { KeyObject } from 'crypto'
import { KeyLike } from 'jose'

export class PrivateKeyProvider {
  static create(): FactoryProvider<KeyObject | KeyLike> {
    return {
      provide: 'privateKey',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<KeyLike | KeyObject> => {
        const privateKey: string = configService.get<string>('privateKey')

        return privateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----')
          ? crypto.createPrivateKey(privateKey)
          : await jose.importPKCS8(privateKey, null)
      }
    }
  }
}
