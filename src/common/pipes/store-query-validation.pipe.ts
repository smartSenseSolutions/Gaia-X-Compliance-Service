import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
const ACCEPTED_STORE_PARAMETERS = ['true', 'false']

@Injectable()
export class StoreQueryValidationPipe implements PipeTransform {
  transform(value: string): boolean {
    if (value === undefined) return false
    if (!ACCEPTED_STORE_PARAMETERS.includes(value)) throw new BadRequestException('Store query parameter must be either true or false')
    return value === 'true'
  }
}
