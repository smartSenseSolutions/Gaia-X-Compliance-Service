import { Test } from '@nestjs/testing'
import { SignatureService } from './signature.service'
import { AppModule } from '../../app.module'
import * as participantSd from '../../tests/fixtures/participant-sd.json'
import * as participantMinimalSd from '../../tests/fixtures/participant-sd-minimal.json'

describe('SignatureService', () => {
  let signatureService: SignatureService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      providers: [SignatureService]
    }).compile()

    signatureService = moduleRef.get<SignatureService>(SignatureService)
  })

  describe('Validation of a Signature', () => {
    let jws: string
    let content: string
    beforeAll(async () => {
      content = 'simple test'
      const result = await signatureService.sign(content)
      jws = result.jws
    })
    it('return a jws', async () => {
      const { jws } = await signatureService.sign(content)
      expect(jws).toHaveProperty('signatures')
      expect(jws).toHaveProperty('payload')
    })

    it('returns true for a valid signature (content matches signature)', async () => {
      const { protectedHeader, content: signatureContent } = await signatureService.verify(jws, process.env.spki)
      expect(protectedHeader).toEqual({ alg: 'PS256' })
      expect(signatureContent).toEqual(content)
    })

    it('returns false for an invalid signature', async () => {
      const invalidJws =
        'eyJhbGciOiJQUzI1NiJ9.c2ltcGxlIHRlc3Q.m83AIUtdGBEps106sFDNfcXbL-bQhenPORI7ueuTHgBDY6SpHwRwRTl_Md1RkJz-eono-01g3pKoAe53UuIckwpaweflQq41nYWKXtxoMc_gjLofktQj5_bx0b-iDUuNNlBjamxzsVqYQMpc86372Xz-Hp4HNKSyvMQxyU0xot2l_FR7NMaNVNqDJOCjiURlQ3IKdx6oCjwafFulX7MqKSxsjJdYkTAQ-y-f_8LFxFo7z-Goo6I-V5SEjvoNV-3QOH8VUH1PJSYyDTtMq5ok76LE9CRha9te9lCRHvk0rQ8ZEAPHibBFGuy1w3OknPotX1HqhXaFLlAMAXES_genYQ'
      try {
        const { protectedHeader, content } = await signatureService.verify(jws, process.env.spki)
        return { protectedHeader, content }
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('Validation of a noramlized and serialized Self Description', () => {
    let canonizedParticipantSd
    let canonizedParticipantMinimalSd
    let canonizedParticipantSortedSd
    const sortObject = o =>
      Object.keys(o)
        .sort()
        .reduce((r, k) => ((r[k] = o[k]), r), {})

    beforeAll(async () => {
      const participantSdCopy = { ...participantSd.selfDescription }
      const sortedParticipantSd = sortObject(participantSdCopy)
      canonizedParticipantSd = await signatureService.canonize(participantSd.selfDescription)
      canonizedParticipantSortedSd = await signatureService.canonize(sortedParticipantSd)
      canonizedParticipantMinimalSd = await signatureService.canonize(participantMinimalSd.selfDescription)
    })

    it('returns true when the signature can be successfully verified and the decoded hash matches the input', async () => {
      const hash = signatureService.hashValue(canonizedParticipantSd)
      const signResult = await signatureService.sign(hash)
      const verifcationResult = await signatureService.verify(signResult.jws, signResult.spkiPem)

      expect(verifcationResult.content).toEqual(hash)
    })

    it('returns false when the signature cannot be verified', async () => {
      const hash1 = signatureService.hashValue(canonizedParticipantSd)
      const hash2 = signatureService.hashValue(canonizedParticipantMinimalSd)
      const signResult = await signatureService.sign(hash1)

      const verifcationResult = await signatureService.verify(signResult.jws, signResult.spkiPem)

      expect(verifcationResult.content).not.toEqual(hash2)
    })

    it('returns true when decoded hashes matches for the same self description', async () => {
      const hash1 = signatureService.hashValue(canonizedParticipantSd)
      const hash2 = signatureService.hashValue(canonizedParticipantSd)
      const signResult1 = await signatureService.sign(hash1)
      const signResult2 = await signatureService.sign(hash2)

      const verifcationResult1 = await signatureService.verify(signResult1.jws, signResult1.spkiPem)
      const verifcationResult2 = await signatureService.verify(signResult2.jws, signResult2.spkiPem)

      expect(verifcationResult1.content).toEqual(verifcationResult2.content)
    })

    it('returns true when the different canonized self description are not equal', async () => {
      expect(canonizedParticipantSd).not.toEqual(canonizedParticipantMinimalSd)
    })

    it('returns true when the same but different sorted self descriptions are equal', async () => {
      expect(canonizedParticipantSd).toEqual(canonizedParticipantSortedSd)
    })

    it('returns true when the same simple object with different order return the same hash', async () => {
      const hash1 = signatureService.hashValue(canonizedParticipantSd)
      const hash2 = signatureService.hashValue(canonizedParticipantSortedSd)

      expect(hash1).toEqual(hash2)
    })
    it('returns true when the same complex object with different order return the same hash', async () => {
      const hash1 = signatureService.hashValue(canonizedParticipantMinimalSd)
      const hash2 = signatureService.hashValue(canonizedParticipantMinimalSd)

      expect(hash1).toEqual(hash2)
    })
    it('returns true when different object return different hash', async () => {
      const hash1 = signatureService.hashValue(canonizedParticipantSd)
      const hash2 = signatureService.hashValue(canonizedParticipantMinimalSd)

      expect(hash1).not.toEqual(hash2)
    })
  })
})
