import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Converted } from './conversion.model'
import { ConversionService } from './conversion.service'

function parseAcceptHeader(acceptHeader: string) {
  return (acceptHeader || '')
    .split(',')
    .map(type => {
      const [mediaType, priority] = type.trim().split(';q=')
      return {
        mediaType: mediaType.trim(),
        priority: priority ? parseFloat(priority) : 1.0
      }
    })
    .sort((a, b) => b.priority - a.priority)
}

@Injectable()
export class ConversionInterceptor implements NestInterceptor {
  constructor(private conversionService: ConversionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest()
    const response: Response = context.switchToHttp().getResponse()
    const acceptHeaders = parseAcceptHeader(request.headers.accept)

    if (acceptHeaders.length) {
      return next.handle().pipe(
        map(async data => {
          let converted: Converted<any>
          for (const header of acceptHeaders) {
            converted = await this.conversionService.convert<any>(header.mediaType, data, null)
            if (converted) break
          }
          converted ??= await this.conversionService.convert('application/json', data)
          response.setHeader('Content-Type', converted.type)
          return converted.value
        })
      )
    }

    return next.handle()
  }
}
