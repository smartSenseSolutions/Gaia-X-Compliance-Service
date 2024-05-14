import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { DateTime } from 'luxon'
import { pki } from 'node-forge'
import { TimeService } from './time.service'

@Injectable()
export class ExpirationDateService {
  constructor(private timeService: TimeService) {}

  readonly logger = new Logger(ExpirationDateService.name)

  public getCertificateExpirationDate(cert: string): Date {
    const certificate = pki.certificateFromPem(cert)
    return certificate.validity.notAfter
  }

  public async isCertificateExpired(currentTime: Date, certValidToDate: Date): Promise<boolean> {
    return certValidToDate <= currentTime
  }

  /**
   * Whether the certificate is expiring before now + threshold
   * @param currentTime now Date
   * @param certNotAfterDate certificate notAfter Date
   * @param threshold the number of days the certificate should be valid to
   * @returns true if today + threshold is after the certificate validTo date
   */
  public async isCertificateExpiringSoon(currentTime: Date, certNotAfterDate: Date, threshold: number): Promise<boolean> {
    const now = DateTime.fromJSDate(currentTime)
    const validTo = DateTime.fromJSDate(certNotAfterDate)

    const nowPlusOffset = now.plus({ days: threshold })
    return nowPlusOffset.startOf('day') > validTo.startOf('day')
  }

  /**
   * This returns the number of days until certificate is no longer valid.
   * @param currentTime now Date
   * @param certNotAfterDate certificate notAfter Date
   * @returns a negative number if the certificate is already expired. Otherwise, the number of days until it's no longer valid
   */
  public async daysBeforeCertExpiration(currentTime: Date, certNotAfterDate: Date): Promise<number> {
    const now = DateTime.fromJSDate(currentTime)
    const validTo = DateTime.fromJSDate(certNotAfterDate)

    return validTo.startOf('day').diff(now.startOf('day'), 'days').days
  }

  public async getExpirationDateBasedOnCertOrThreshold(cert: string, threshold: number) {
    const now = await this.timeService.getNtpTime()
    const validTo = this.getCertificateExpirationDate(cert)

    const nowPlusOffset = new Date(now)
    nowPlusOffset.setDate(now.getDate() + threshold)
    if (await this.isCertificateExpired(now, validTo)) {
      this.logger.error('The certificate is expired, credential cannot be issued')
      throw new ServiceUnavailableException(null, 'Certificate is outdated and cannot be used to issue credentials')
    }
    if (await this.isCertificateExpiringSoon(now, validTo, threshold)) {
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
