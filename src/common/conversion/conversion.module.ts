import { Module } from '@nestjs/common'
import { ConversionInterceptor } from './conversion.interceptor'
import { ConversionService } from './conversion.service'
import { JsonConversionService } from './json.service'
import { JWTVCConversionService } from './jwt-vc.service'
import { JWTVPConversionService } from './jwt-vp.service'

@Module({
  providers: [
    ConversionService,
    ConversionInterceptor,
    JWTVCConversionService,
    JWTVPConversionService,
    JsonConversionService,
    {
      provide: 'converters',
      useFactory: (...args) => args,
      inject: [JWTVCConversionService, JsonConversionService, JWTVPConversionService]
    }
  ],
  exports: [ConversionService]
})
export class ConversionModule {}
