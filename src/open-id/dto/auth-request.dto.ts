import { ClientMetadataDto } from './client-metadata.dto'
import { PresentationDefinitionDto } from './presentation-definition.dto'

export interface AuthRequestDto {
  scope: string | 'openid'
  response_type: string | 'vp_token'
  response_mode: string | 'direct_post'
  client_id: string
  redirect_uri: string
  nonce: string
  client_id_scheme: string | 'redirect_uri'
  client_metadata: ClientMetadataDto
  presentation_definition: PresentationDefinitionDto
}
