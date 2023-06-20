import { Injectable } from '@nestjs/common'
import { Converter } from './conversion.model'

const jsonType = 'application/json'

@Injectable()
export class JsonConversionService implements Converter<string> {
  accept(type: string): boolean {
    return type === jsonType
  }

  async convert(value: any) {
    return { type: jsonType, value: JSON.stringify(value, null, 2) }
  }
}
