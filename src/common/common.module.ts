import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CertificateExpirationBatch } from '../batch/certificate-expiration.batch'
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
import { ExpirationDateService } from './services/expiration-date.service'
import { TrustFramework2210ValidationService } from './services/tf2210/trust-framework-2210-validation.service'
import { VcQueryService } from './services/vc-query.service'
import { VerifiablePresentationValidationService } from './services/verifiable-presentation-validation.service'

@Module({
  imports: [HttpModule, ConversionModule, ConfigModule],
  controllers: [CommonController],
  providers: [
    ExpirationDateService,
    CertificateExpirationBatch,
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
export class CommonModule {}
