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
      const invalidJws =
        'eyJhbGciOiJQUzI1NiJ9.c2ltcGxlIHRlc3Q.m83AIUtdGBEps106sFDNfcXbL-bQhenPORI7ueuTHgBDY6SpHwRwRTl_Md1RkJz-eono-01g3pKoAe53UuIckwpaweflQq41nYWKXtxoMc_gjLofktQj5_bx0b-iDUuNNlBjamxzsVqYQMpc86372Xz-Hp4HNKSyvMQxyU0xot2l_FR7NMaNVNqDJOCjiURlQ3IKdx6oCjwafFulX7MqKSxsjJdYkTAQ-y-f_8LFxFo7z-Goo6I-V5SEjvoNV-3QOH8VUH1PJSYyDTtMq5ok76LE9CRha9te9lCRHvk0rQ8ZEAPHibBFGuy1w3OknPotX1HqhXaFLlAMAXES_genYQ'
      try {
        const { protectedHeader, content } = await signatureService.verify(invalidJws)
        return { protectedHeader, content }
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })
})
