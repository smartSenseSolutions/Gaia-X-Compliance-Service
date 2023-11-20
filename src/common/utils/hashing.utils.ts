import { createHash } from 'crypto'

export class HashingUtils {
  static sha256(input: string): string {
    if (!input) {
      return null
    }

    return createHash('sha256').update(input).digest('hex')
  }

  static sha512(input: string): string {
    if (!input) {
      return null
    }

    return createHash('sha512').update(input).digest('hex')
  }
}
