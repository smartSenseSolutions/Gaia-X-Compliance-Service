import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ShaclService } from './services/shacl.service'

@Module({
  imports: [HttpModule],
  providers: [ShaclService],
  exports: [ShaclService]
})
export class CommonModule {}
