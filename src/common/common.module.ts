import { HttpModule } from '@nestjs/axios'
import { Module, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { KeyLike } from 'jose'
import { ParticipantContentValidationService } from '../participant/services/participant-content-validation.service'
import { ServiceOfferingContentValidationService } from '../service-offering/services/service-offering-content-validation.service'
import { ServiceOfferingLabelLevelValidationService } from '../service-offering/services/service-offering-label-level-validation.service'
import { CommonController } from './common.controller'
import { ConversionModule } from './conversion/conversion.module'
import { DidResolverProvider } from './providers/did-resolver.provider'
import { DocumentLoaderProvider } from './providers/document-loader.provider'
import { GaiaXSignatureSignerProvider } from './providers/gaia-x-signature-signer.provider'
import { GaiaXSignatureVerifierProvider } from './providers/gaia-x-signature-verifier.provider'
import { JsonWebSignature2020VerifierProvider } from './providers/json-web-signature-2020-verifier.provider'
import { PrivateKeyProvider } from './providers/private-key.provider'
import { ProofService, RegistryService, ShaclService, TimeService } from './services'
import { TrustFramework2210ValidationService } from './services/tf2210/trust-framework-2210-validation.service'
import { VcQueryService } from './services/vc-query.service'
import { VerifiablePresentationValidationService } from './services/verifiable-presentation-validation.service'
import { createDidDocument } from './utils'
import { CertificateUtil } from './utils/certificate.util'

@Module({
  imports: [HttpModule, ConversionModule, ConfigModule.forRoot()],
  controllers: [CommonController],
  providers: [
    ParticipantContentValidationService,
    ProofService,
    ShaclService,
    RegistryService,
    ServiceOfferingContentValidationService,
    ServiceOfferingLabelLevelValidationService,
    TimeService,
    TrustFramework2210ValidationService,
    VcQueryService,
    VerifiablePresentationValidationService,
    GaiaXSignatureSignerProvider.create(),
    GaiaXSignatureVerifierProvider.create(),
    JsonWebSignature2020VerifierProvider.create(),
    DidResolverProvider.create(),
    PrivateKeyProvider.create(),
    DocumentLoaderProvider.create()
  ],
  exports: [ProofService, RegistryService, ShaclService]
})
export class CommonModule implements OnApplicationBootstrap {
  constructor(private readonly configService: ConfigService) {}

  async onApplicationBootstrap() {
    const x509Certificate: string = this.configService.get<string>('X509_CERTIFICATE')
    const privateKeyAlg: string = this.configService.get<string>('PRIVATE_KEY_ALG', 'PS256')

    const certificate: KeyLike = await CertificateUtil.loadCertificate(x509Certificate)
    await createDidDocument(certificate, privateKeyAlg)
  }
}
