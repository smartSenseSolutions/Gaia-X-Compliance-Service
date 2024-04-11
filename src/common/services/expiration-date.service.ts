import { Injectable, Logger } from '@nestjs/common'
import { pki } from 'node-forge'
import { TimeService } from './time.service'

@Injectable()
export class ExpirationDateService {
  constructor(private timeService: TimeService) {}

  readonly logger = new Logger(ExpirationDateService.name)

  public async getExpirationDateBasedOnCertOrThreshold(cert: string, threshold: number) {
    const now = await this.timeService.getNtpTime()
    const certificate = pki.certificateFromPem(cert)
    const validTo = certificate.validity.notAfter

    const nowPlusOffset = new Date()
    nowPlusOffset.setDate(now.getDate() + threshold)

    if (nowPlusOffset > validTo) {
      // Need to reduce VC duration
      this.logger.warn(
        `Certificate expires before expected end of life of credential ${nowPlusOffset.toISOString()}. Adjusting to certificate validTo ${validTo.toISOString()}`
      )
      return validTo
    } else {
      return nowPlusOffset
    }
  }
}
