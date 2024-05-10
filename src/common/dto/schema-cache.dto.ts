import { ApiProperty } from '@nestjs/swagger'
import DatasetExt from 'rdf-ext/lib/Dataset'

export class Schema_caching {
  @ApiProperty({
    description: 'schema cached'
  })
  development: {
    shape?: DatasetExt
    //expires: string
  }
}
