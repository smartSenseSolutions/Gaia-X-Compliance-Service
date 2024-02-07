import { Provider } from '@nestjs/common'
import { DidResolver } from '@gaia-x/json-web-signature-2020'

export class DidResolverProvider {
  static create(): Provider {
    return {
      provide: DidResolver,
      useFactory: () => {
        return new DidResolver()
      }
    }
  }
}
