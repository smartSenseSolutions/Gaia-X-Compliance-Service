// TODO base on https://openid.net/specs/openid-connect-discovery-1_0.html
//  and https://openid.github.io/OpenID4VP/openid-4-verifiable-presentations-wg-draft.html#response_mode_post
import { EncryptionAlgorithmEnum } from '../../common/enum/encryption-algorithm.enum'

export interface ClientMetadataDto {
  client_name: string
  vp_formats: {
    jwt_vc: {
      alg: EncryptionAlgorithmEnum[]
    }
    jwt_vp: {
      alg: EncryptionAlgorithmEnum[]
    }
  }
  scopes_supported: string[] | ['openid']
  response_types_supported: string[] | ['vp_token']
  subject_types_supported: string[] | ['public']
  subject_syntax_types_supported: string[] | ['did:web', 'did:key']
  id_token_signing_alg_values_supported: string[]
}
