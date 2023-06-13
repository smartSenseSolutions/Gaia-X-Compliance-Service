import { Module } from '@nestjs/common'
import { ConversionInterceptor } from './conversion.interceptor'
import { ConversionService } from './conversion.service'
import { JsonConversionService } from './json.service'
import { JWTConversionService } from './jwt.service'

@Module({
  providers: [
    ConversionService,
    ConversionInterceptor,
    JWTConversionService,
    JsonConversionService,
    {
      provide: 'converters',
      useFactory: (...args) => args,
      inject: [JWTConversionService, JsonConversionService]
    }
  ],
  exports: [ConversionService]
})
export class ConversionModule {}
