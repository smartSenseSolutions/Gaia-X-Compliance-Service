import { Injectable } from '@nestjs/common'
import * as jose from 'jose'
import { createHash } from 'crypto'
import * as jsonld from 'jsonld'

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
  // async verify(jws: string): Promise<Verification> {
  //   const algorithm = 'PS256'
  //   const rsaPublicKey = await jose.importSPKI(process.env.spki, algorithm)
  //   try {
  //     const { payload, protectedHeader } = await jose.compactVerify(jws, rsaPublicKey)

  //     return { protectedHeader, content: new TextDecoder().decode(payload) }
  //   } catch (error) {
  //     throw Error('invalid jws')
  //   }
  // }

  async verify(jws: any, spki: string): Promise<any> {
    const algorithm = 'RS256'
    const ecPublicKey = await jose.importSPKI(spki, algorithm)
    try {
      const { payload, protectedHeader } = await jose.generalVerify(jws, ecPublicKey)

      return { protectedHeader, content: new TextDecoder().decode(payload) }
    } catch (error) {
      return {}
    }
  }

  public async canonize(doc: object) {
    const canonized = await jsonld.canonize(doc, {
      algorithm: 'URDNA2015',
      format: 'application/n-quads'
    })

    return canonized
  }

  public hashValue(input: string): string {
    return createHash('sha256').update(input).digest('hex')
  }

  // async sign(content: any): Promise<Signature> {
  //   const algorithm = 'PS256'
  //   const rsaPrivateKey = await jose.importPKCS8(process.env.privateKey, algorithm)
  //   const jws = await new jose.CompactSign(new TextEncoder().encode(content)).setProtectedHeader({ alg: 'PS256' }).sign(rsaPrivateKey)

  //   return { jws, spkiPem: process.env.spki }
  // }

  async sign(hash: string): Promise<any> {
    const algorithm = 'RS256'
    const rsaPrivateKey = await jose.importPKCS8(process.env.privateKey, algorithm)

    const jws = await new jose.GeneralSign(new TextEncoder().encode(hash)).addSignature(rsaPrivateKey).setProtectedHeader({ alg: 'PS256' }).sign()

    return { jws, spkiPem: process.env.spki }
  }
}
