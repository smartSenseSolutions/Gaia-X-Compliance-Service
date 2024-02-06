import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CredentialSupportedJwtVcJsonLdAndLdpVc } from '@sphereon/oid4vci-common'
import { KeyLike } from 'jose'
import { OIDC4VCIService } from '../../../../gaia-x-oidc4vc/service/oidc4vci.service'
import { CredentialSubjectDto, VerifiableCredentialDto } from '../../common/dto'

@Injectable()
export class OpenIdVcService extends OIDC4VCIService<VerifiableCredentialDto<CredentialSubjectDto>> {
  constructor(private readonly configService: ConfigService, @Inject('josePrivateKey') privateKey: KeyLike) {
    const credentialsSupported: CredentialSupportedJwtVcJsonLdAndLdpVc[] = [
      {
        format: 'jwt_vc_json',
        // scope: 'LegalRegistrationNumber',
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://w3id.org/security/suites/jws-2020/v1',
          'https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#'
        ],
        id: 'gx:compliance',
        types: ['VerifiableCredential', 'gx:compliance'],
        display: [
          {
            name: 'Gaia-X Compliance',
            locale: 'en-US',
            logo: {
              url: 'https://www.systnaps.com/wp-content/uploads/2021/04/Gaia-X_Logo_Standard_RGB_Transparent_210401-e1617719976112.png',
              alt_text: 'The Gaia-X logo'
            },
            background_color: '#cecece',
            text_color: '#1a1a1a'
          }
        ]
      }
    ]

    super(configService.get<string>('BASE_URL'), privateKey, credentialsSupported, 'Gaia-X Compliance Engine')
  }
}
