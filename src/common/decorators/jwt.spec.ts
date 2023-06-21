import { Request } from 'express'
import { readJwtOrJsonBodyFromRequest } from './jwt.decorator'

const ValidJWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

const InvalidJWT = 'SomeInvalidRandomString'

const ValidJson = '{"iat":1516239022,"sub":"1234567890","name":"John Doe"}'
const InvalidJson = 'John Doe'

function mockRequest(body: string, readable = true): Request {
  return { body, readable } as Request
}

function mockReadBody(req: Request): Promise<Buffer> {
  return Promise.resolve(Buffer.from(req.body))
}

describe('JWTBody', () => {
  describe('JWT should read either JSON or JWT body', () => {
    it('read a valid JWT body successfully', async () => {
      const res = await readJwtOrJsonBodyFromRequest(mockRequest(ValidJWT), { reader: mockReadBody })
      expect(res.iat).toBe(1516239022)
      expect(res.sub).toBe('1234567890')
      expect(res.name).toBe('John Doe')
    })
    it('throw an error when reading an invalid JWT body', async () => {
      await expect(readJwtOrJsonBodyFromRequest(mockRequest(InvalidJWT), { reader: mockReadBody })).rejects.toThrow(SyntaxError)
    })
    it('read a valid JSON body successfully', async () => {
      const res = await readJwtOrJsonBodyFromRequest(mockRequest(ValidJson), { reader: mockReadBody })
      expect(res.iat).toBe(1516239022)
      expect(res.sub).toBe('1234567890')
      expect(res.name).toBe('John Doe')
    })
    it('throw an error when reading an invalid JSON body', async () => {
      await expect(readJwtOrJsonBodyFromRequest(mockRequest(InvalidJson), { reader: mockReadBody })).rejects.toThrow(SyntaxError)
    })
    it('an already read body should be taken as it is', async () => {
      const res = await readJwtOrJsonBodyFromRequest(mockRequest(JSON.parse(ValidJson), false), { reader: mockReadBody })
      expect(res.iat).toBe(1516239022)
      expect(res.sub).toBe('1234567890')
      expect(res.name).toBe('John Doe')
    })
  })
})
