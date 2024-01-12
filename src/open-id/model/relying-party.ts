import { ConfigService } from '@nestjs/config'
import { join } from 'path'
import { EncryptionAlgorithmEnum } from '../../common/enum/encryption-algorithm.enum'
import { AuthRequestDto } from '../dto/auth-request.dto'
import { ClientMetadataDto } from '../dto/client-metadata.dto'
import { PresentationDefinitionDto } from '../dto/presentation-definition.dto'

export class RelyingParty {
  private readonly supportedEncryptionAlgorithms: EncryptionAlgorithmEnum[]
  private readonly redirectionEndpoint: string

  constructor(private readonly configService: ConfigService) {
    this.supportedEncryptionAlgorithms = [EncryptionAlgorithmEnum.ES256]
    this.redirectionEndpoint = new URL(join('open-id', 'verifiablePresentation'), this.configService.get<string>('BASE_URL')).toString()
  }

  buildAuthRequest(authSessionId: string, clientId: string, nonce: string): AuthRequestDto {
    return {
      client_id: clientId,
      nonce: nonce,
      redirect_uri: `${this.redirectionEndpoint}/${authSessionId}`,
      response_mode: 'direct_post',
      response_type: 'vp_token',
      scope: 'openid',
      client_id_scheme: 'redirect_uri',
      client_metadata: this.buildClientMetadata(),
      presentation_definition: this.buildPresentationDefinition()
    }
  }

  private buildClientMetadata(): ClientMetadataDto {
    return {
      client_name: 'Gaia-X Compliance',
      vp_formats: {
        jwt_vc: {
          alg: this.supportedEncryptionAlgorithms
        },
        jwt_vp: {
          alg: this.supportedEncryptionAlgorithms
        }
      },
      scopes_supported: ['openid'],
      response_types_supported: ['vp_token'],
      subject_types_supported: ['public'],
      subject_syntax_types_supported: ['did:web', 'did:key'],
      id_token_signing_alg_values_supported: this.supportedEncryptionAlgorithms
    }
  }

  private buildPresentationDefinition(): PresentationDefinitionDto {
    return {
      id: 'Compliance Requirements',
      format: {
        jwt_vc: {
          alg: this.supportedEncryptionAlgorithms
        },
        jwt_vp: {
          alg: this.supportedEncryptionAlgorithms
        }
      },
      input_descriptors: [
        {
          constraints: {
            fields: [
              {
                filter: {
                  type: 'array',
                  contains: {
                    const: 'gx:LegalParticipant'
                  }
                },
                path: ['$.type']
              }
            ]
          },
          format: {
            jwt_vc: {
              alg: this.supportedEncryptionAlgorithms
            },
            jwt_vp: {
              alg: this.supportedEncryptionAlgorithms
            }
          },
          id: 'Legal Participant'
        }
      ]
    }
  }
}
