import { Injectable } from '@nestjs/common'
import { ConversionContext, Converter } from './conversion.model'
import crypto from 'crypto'
import { JWT_VP_CONTENT_TYPE } from '../constants'
import { signJWT } from '../utils/jwt.util'

@Injectable()
export class JWTVPConversionService implements Converter<string> {
  accept(type: string): boolean {
    return JWT_VP_CONTENT_TYPE === type
  }

  async convert(vc: any, context: ConversionContext, type: string) {
    delete vc['proof']
    const vp = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: await Promise.all(
        vc.credentialSubject
          .map((credentialSubject: any) => ({
            vc: {
              ...vc,
              id: `${process.env.BASE_URL}/credential-offers/${crypto.randomUUID()}`,
              credentialSubject
            }
          }))
          .map((payload: any) => signJWT(vc, payload, payload.vc.id))
      )
    }

    return { type, value: await signJWT(vc, { vp }) }
  }
}
