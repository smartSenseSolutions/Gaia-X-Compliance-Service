import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { SignatureService, ShaclService, SelfDescriptionService, RegistryService, ProofService, VpParserService } from './services'
import { CommonController } from './common.controller'
import { SoapService } from './services'
@Module({
  imports: [HttpModule],
  controllers: [CommonController],
  providers: [ProofService, ShaclService, SelfDescriptionService, SignatureService, RegistryService, SoapService, VpParserService],
  exports: [ProofService, ShaclService, SelfDescriptionService, SignatureService, RegistryService, SoapService, VpParserService]
})
export class CommonModule {}
