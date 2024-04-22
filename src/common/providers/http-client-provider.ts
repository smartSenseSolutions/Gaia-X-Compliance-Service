import { Provider } from '@nestjs/common'
import got, { Got } from 'got'

export class HttpClientProvider {
  static create(): Provider<Got> {
    return {
      provide: 'got',
      useValue: got
    }
  }
}
