import { Injectable } from '@nestjs/common'
import * as jose from 'jose'

export interface Signature {
  jws: string
  spkiPem: string
}

export interface Verification {
  protectedHeader: jose.CompactJWSHeaderParameters
  content: string
}

@Injectable()
export class SignatureService {
  async verify(jws: string): Promise<Verification> {
    const algorithm = 'PS256'
    const ecPublicKey = await jose.importSPKI(process.env.spki, algorithm)
    try {
      const { payload, protectedHeader } = await jose.compactVerify(jws, ecPublicKey)

      return { protectedHeader, content: new TextDecoder().decode(payload) }
    } catch (error) {
      throw Error('invalid jws')
    }
  }

  async sign(content: any): Promise<Signature> {
    const algorithm = 'PS256'
    const ecPrivateKey = await jose.importPKCS8(process.env.privateKey, algorithm)
    const jws = await new jose.CompactSign(new TextEncoder().encode(content)).setProtectedHeader({ alg: 'PS256' }).sign(ecPrivateKey)

    return { jws, spkiPem: process.env.spki }
  }
}
