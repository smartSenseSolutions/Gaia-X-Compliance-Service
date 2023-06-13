export interface Converted<T> {
  type: string
  value: T
}

export interface Converter<T> {
  priority?: number
  accept(type: string): boolean
  convert(src: any, targetType?: string): Promise<Converted<T>>
}
