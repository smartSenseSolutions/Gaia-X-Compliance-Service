import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import getRawBody from 'raw-body'

export const JWTBody = createParamDecorator(async (_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>()
  if (request.readable) {
    const body = (await getRawBody(request)).toString('utf8').trim()
    try {
      const parts = body.split('.')
      return JSON.parse(Buffer.from(parts.length > 1 ? parts[1] : parts[0], 'base64').toString())
    } catch {
      // not a JWT, fallback to default behaviour
      return JSON.parse(body)
    }
  }
  return request.body
})
