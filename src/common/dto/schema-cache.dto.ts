import { ApiProperty } from '@nestjs/swagger'
import DatasetExt from 'rdf-ext/lib/Dataset'

export class Schema_caching {
  @ApiProperty({
    description: 'Participant schema cached'
  })
  LegalParticipant: {
    shape?: DatasetExt
    //expires: string
  }

  @ApiProperty({
    description: 'Service-offering schema cached'
  })
  ServiceOfferingExperimental: {
    shape?: DatasetExt
    //expires: string
  }

  legalRegistrationNumber: {
    shape?: DatasetExt
  }
}
