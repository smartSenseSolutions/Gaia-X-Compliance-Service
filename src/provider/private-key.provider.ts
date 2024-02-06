import { FactoryProvider } from '@nestjs/common'
import * as jose from 'jose'
import * as process from 'process'
import { KeyLike } from 'jose'

export default {
  provide: 'josePrivateKey',
  async useFactory(): Promise<KeyLike> {
    return await jose.importPKCS8(process.env.PRIVATE_KEY, 'ES256')
  }
} as FactoryProvider<KeyLike>
