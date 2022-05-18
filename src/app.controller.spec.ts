import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController]
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
