import { Inject, Injectable } from '@nestjs/common'
import { Converted, Converter } from './conversion.model'

@Injectable()
export class ConversionService {
  constructor(@Inject('converters') private converters: Converter<any>[]) {}

  async convert<T, S = any>(type: string, value: S, defaultValue: Converted<T> = { type, value: value as any }): Promise<Converted<T>> {
    const handler = this.converters.filter(c => c.accept(type)).sort((a, b) => b.priority - a.priority)?.[0]
    return handler ? await handler.convert(value, type) : defaultValue
  }
}
