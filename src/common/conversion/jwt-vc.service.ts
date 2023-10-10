import { Injectable } from '@nestjs/common'
import { JWT_VC_CONTENT_TYPES, JWT_VP_CONTENT_TYPE } from '../constants'
import { getDidWeb } from '../utils'
import { signJWT } from '../utils/jwt.util'
import { ConversionContext, Converter } from './conversion.model'
import { JWTVPConversionService } from './jwt-vp.service'

@Injectable()
export class JWTVCConversionService implements Converter<string> {
  constructor(private jwtVPConversionService: JWTVPConversionService) {}

  accept(type: string): boolean {
    return JWT_VC_CONTENT_TYPES.includes(type)
  }

  async convert(vc: any, context: ConversionContext, type: string) {
    if (vc.credentialSubject?.length > 1) {
      return this.jwtVPConversionService.convert(vc, context, JWT_VP_CONTENT_TYPE)
    }
    const providers = new Set(
      (context.body?.verifiableCredential ?? []).map((vc: any) => vc.credentialSubject?.['gx:providedBy']?.id).filter((pb: string) => pb)
    )
    const singleProvider = providers.size === 1 ? providers.values().next().value : undefined
    const issuer = getDidWeb()
    const subject = singleProvider ?? vc.id ?? issuer
    delete vc['proof']

    const payload = this.flattenCredentialSubject(vc)
    return { type, value: await signJWT(vc, payload, subject) }
  }

  flattenCredentialSubject(vc: any) {
    return {
      vc: {
        ...vc,
        credentialSubject: Array.isArray(vc.credentialSubject) ? vc.credentialSubject[0] : vc.credentialSubject
      }
    }
  }
}
