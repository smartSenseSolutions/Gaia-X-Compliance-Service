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
    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()
    const acceptHeaders = parseAcceptHeader(request.headers.accept)

    if (acceptHeaders.length) {
      return next.handle().pipe(
        map(async data => {
          const conversionContext = {
            body: request.body
          }
          let converted: Converted<any>
          for (const header of acceptHeaders) {
            // Last parameter is null to avoid default conversion: we expect the exact type in this loop
            converted = await this.conversionService.convert(header.mediaType, data, conversionContext, null)
            if (converted) break
          }
          // If no converter succeeded, fallback to application/json
          converted ??= await this.conversionService.convert('application/json', data, conversionContext)
          response.setHeader('Content-Type', converted.type)
          return converted.value
        })
      )
    }

    return next.handle()
  }
}
