export interface Converted<T> {
  type: string
  value: T
}

export interface ConversionContext {
  body?: any
}

export interface Converter<T> {
  priority?: number
  accept(type: string): boolean
  convert(src: any, context: ConversionContext, targetType?: string): Promise<Converted<T>>
}
