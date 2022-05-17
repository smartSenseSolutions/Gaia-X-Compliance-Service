import { Test } from '@nestjs/testing'
import { SignatureService } from './signature.service'
import { AppModule } from '../../app.module'

describe('SignatureService', () => {
  let signatureService: SignatureService
  let jws: string
  let content: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      providers: [SignatureService]
    }).compile()

    signatureService = moduleRef.get<SignatureService>(SignatureService)
    content = 'simple test'
    ;({ jws } = await signatureService.sign(content))
  })

  describe('Validation of a Signature', () => {
    it('return a jws', async () => {
      const { jws } = await signatureService.sign({ content })
      expect(jws).toEqual(expect.stringContaining('ey'))
    })

    it('returns true for a valid signature (content matches signature)', async () => {
      const { protectedHeader, content: signatureContent } = await signatureService.verify(jws)
      expect(protectedHeader).toEqual({ alg: 'PS256' })
      expect(signatureContent).toEqual(content)
    })

    it('returns false for an invalid signature', async () => {
      const jws = process.env.jws_wrong
      try {
        const { protectedHeader, content } = await signatureService.verify(jws)
        return { protectedHeader, content }
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })
})
