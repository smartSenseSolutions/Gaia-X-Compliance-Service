import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ValidationResult } from '../../common/dto/validation-result.dto'

@Injectable()
export class ServiceOfferingContentValidationService {
  constructor(private readonly httpService: HttpService) {}

  async validate(data: any): Promise<ValidationResult> {
    return { conforms: true, results: [] }
  }
}
