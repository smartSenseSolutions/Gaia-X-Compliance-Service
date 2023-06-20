import { Inject, Injectable } from '@nestjs/common'
import { Converted, Converter, ConversionContext } from './conversion.model'

@Injectable()
export class ConversionService {
  constructor(@Inject('converters') private converters: Converter<any>[]) {}

  async convert<T>(
    type: string,
    value: any,
    context: ConversionContext,
    defaultValue: Converted<T> = { type, value: value as any }
  ): Promise<Converted<T>> {
    const handler = this.converters.filter(c => c.accept(type)).sort((a, b) => b.priority - a.priority)?.[0]
    return handler ? await handler.convert(value, context, type) : defaultValue
  }
}
