import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService]
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return description of software', () => {
      expect(appController.getDescription()).toEqual(
        expect.objectContaining({
          software: expect.any(String),
          description: expect.any(String),
          version: expect.any(String)
        })
      )
    })
  })
})
