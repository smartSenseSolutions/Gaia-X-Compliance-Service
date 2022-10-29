import { Module } from '@nestjs/common'
import { ConfigModule as CModule } from '@nestjs/config'

@Module({
  imports: [
    CModule.forRoot({
      cache: true,
      isGlobal: true
    })
  ]
})
export class ConfigModule {}
