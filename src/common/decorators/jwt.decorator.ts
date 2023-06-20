import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import getRawBody from 'raw-body'

export const JWTBody = createParamDecorator((_: unknown, ctx: ExecutionContext) => readJwtOrJsonBodyFromRequest(ctx.switchToHttp().getRequest()))

export async function readJwtOrJsonBodyFromRequest(request: Request) {
  if (request.readable) {
    const rawBody = (await getRawBody(request)).toString('utf8').trim()
    let body: any
    try {
      const parts = rawBody.split('.')
      body = JSON.parse(Buffer.from(parts.length > 1 ? parts[1] : parts[0], 'base64').toString())
    } catch {
      // not a JWT, fallback to JSON
      body = JSON.parse(rawBody)
    }
    request.body = body
  }
  return request.body
}
