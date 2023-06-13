import { Injectable } from '@nestjs/common'
import { Converter } from './conversion.model'

@Injectable()
export class JsonConversionService implements Converter<string> {
  accept(type: string): boolean {
    return type === 'application/json'
  }

  async convert<S>(value: S, type: string) {
    return { type, value: JSON.stringify(value, null, 2) }
  }
}
