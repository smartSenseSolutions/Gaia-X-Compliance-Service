import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { DEFAULT_VC_LIFE_EXPECTANCY_IN_DAYS } from '../common/constants'
import { TimeService } from '../common/services'
import { ExpirationDateService } from '../common/services/expiration-date.service'

@Injectable()
export class CertificateExpirationBatch {
  private readonly logger = new Logger(CertificateExpirationBatch.name)

  constructor(private configService: ConfigService, private expirationDateService: ExpirationDateService, private timeService: TimeService) {}

  @Cron(CronExpression.EVERY_12_HOURS)
  public async checkCertificateExpiry() {
    const threshold = Number.parseInt(process.env.vcLifeExpectancyInDays || DEFAULT_VC_LIFE_EXPECTANCY_IN_DAYS)
    this.logger.log(`Running CertificateExpirationBatch. Cert should be valid for at least ${threshold} days `)
    const x509CERTIFICATE = this.configService.get<string>('X509_CERTIFICATE')
    const certExpirationDate = this.expirationDateService.getCertificateExpirationDate(x509CERTIFICATE)
    const now = await this.timeService.getNtpTime()

    if (await this.expirationDateService.isCertificateExpiringSoon(now, certExpirationDate, threshold)) {
      this.logger.warn(
        `[ALERT] The certificate is expiring in ${await this.expirationDateService.daysBeforeCertExpiration(now, certExpirationDate)} days!`
      )
    }
    if (await this.expirationDateService.isCertificateExpired(now, certExpirationDate)) {
      this.logger.warn('[ALERT] The certificate is expired!')
    }
    this.logger.log('Done with CertificateExpirationBatch')
  }
}
