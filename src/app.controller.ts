import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { name, description, version } from '../package.json'
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getDescription() {
    return {
      software: name,
      description,
      version
    }
  }
}
