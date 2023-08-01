import { Test, TestingModule } from '@nestjs/testing'
import { TimeService } from './time.service'
import { NtpTimeSync } from 'ntp-time-sync'

jest.mock('ntp-time-sync', () => ({
  NtpTimeSync: {
    getInstance: jest.fn().mockReturnThis(),
    getTime: jest.fn()
  }
}))

describe('TimeService', () => {
  let service: TimeService
  let loggerSpy
  let getTimeMock

  beforeEach(async () => {
    getTimeMock = NtpTimeSync.getInstance().getTime

    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeService]
    }).compile()

    service = module.get<TimeService>(TimeService)
    loggerSpy = jest.spyOn(service['logger'], 'error')
  })

  afterEach(() => {
    // Clean up spy
    loggerSpy.mockRestore()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should get NTP time successfully', async () => {
    const now = new Date()
    getTimeMock.mockResolvedValue({ now })

    const result = await service.getNtpTime()

    expect(result).toEqual(now)
    expect(loggerSpy).not.toHaveBeenCalled()
  })

  it('should log an error and return local time when NTP fetch fails', async () => {
    const localTimeSpy = jest.spyOn(Date, 'now')
    const error = new Error('Expected NTP Error for testing purposes')
    getTimeMock.mockRejectedValue(error)

    await service.getNtpTime()

    // Check if error was logged
    expect(loggerSpy).toHaveBeenCalledWith('Failed to fetch NTP time:', error)
    // Check if local time was used
    expect(localTimeSpy).toHaveBeenCalled()
  })
})
