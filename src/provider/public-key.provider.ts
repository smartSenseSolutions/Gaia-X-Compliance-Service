import { FactoryProvider } from '@nestjs/common'
import * as jose from 'jose'
import * as process from 'process'
import { KeyLike } from 'jose'

export default {
  provide: 'josePublicKey',
  async useFactory(): Promise<KeyLike> {
    return await jose.importX509(process.env.PUBLIC_KEY, 'ES256')
  }
} as FactoryProvider<KeyLike>
