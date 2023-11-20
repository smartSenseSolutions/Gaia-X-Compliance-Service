import { Injectable, Logger } from '@nestjs/common'
import { NtpTimeSync } from 'ntp-time-sync'

@Injectable()
export class TimeService {
  private readonly logger = new Logger(TimeService.name)
  private readonly options = {
    servers: process.env.ntpServers ? JSON.parse(process.env.ntpServers) : ['0.pool.ntp.org', '1.pool.ntp.org', '2.pool.ntp.org', '3.pool.ntp.org']
  }
  // singleton instance of ntp-time-sync
  private timeSync = NtpTimeSync.getInstance(this.options)

  async getNtpTime(): Promise<Date> {
    try {
      const result = await this.timeSync.getTime()
      return result.now
    } catch (error) {
      this.logger.error('Failed to fetch NTP time:', error)
      const localTime = new Date()
      this.logger.warn(`Falling back to local time: ${localTime}`)
      return localTime
    }
  }
}
