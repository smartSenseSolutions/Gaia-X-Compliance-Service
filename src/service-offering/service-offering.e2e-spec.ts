import supertest from 'supertest'
import { Test } from '@nestjs/testing'
import { INestApplication, NotImplementedException } from '@nestjs/common'
import { ServiceOfferingModule } from './service-offering.module'
import * as ParticipantSDFixture from '../tests/fixtures/participant-sd.json'
import * as ParticipantSDMinimalFixture from '../tests/fixtures/participant-sd-minimal.json'
import * as ParticipantSDFaultyFixture from '../tests/fixtures/participant-sd-faulty.json'
import { AppModule } from '../app.module'

describe('Participant (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, ServiceOfferingModule]
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })
  //TODO: implement tests
  describe(`Validation of Service Offering Self Descriptions`, () => {
    it.skip('Validates a correct minimal Service Offering self description', async () => {
      throw new NotImplementedException()
    })
  })
})
