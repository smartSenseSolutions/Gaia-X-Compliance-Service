import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    console.log(`Request [${req.method}] ${req.url} - ${JSON.stringify(req.params)} : ${JSON.stringify(req.body)}`)
    next()
  }
}
