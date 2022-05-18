import { Controller, Get } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { name, description, version, repository, bugs } from '../package.json'

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  getDescription() {
    return {
      software: name,
      description,
      version,
      documentation: `${process.env.BASE_URL}/api`,
      repository,
      bugs
    }
  }
}
