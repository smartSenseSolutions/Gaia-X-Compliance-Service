import { ServiceUnavailableException } from '@nestjs/common'
import { DateTime } from 'luxon'
import { pki } from 'node-forge'
import { CertificateBuilderSpec } from '../../tests/certificate-builder.spec'
import { ExpirationDateService } from './expiration-date.service'
import { TimeService } from './time.service'

describe('ExpirationDateService', () => {
  let expirationDateService
  let timeService

  beforeEach(() => {
    timeService = new TimeService()
    expirationDateService = new ExpirationDateService(timeService)
  })

  it('should return the end date of the certificate when the end date is after it', async () => {
    const currentTime = new Date()
    jest.spyOn(timeService, 'getNtpTime').mockImplementation(() => currentTime)
    const cert = CertificateBuilderSpec.createCertificate(1)
    const expirationDate = await expirationDateService.getExpirationDateBasedOnCertOrThreshold(pki.certificateToPem(cert), 90)
    expect(DateTime.fromJSDate(expirationDate).startOf('day').equals(DateTime.fromJSDate(cert.validity.notAfter).startOf('day'))).toBeTruthy()
  })
  it('should return the end date from threshold when certificate expiration date is after threshold', async () => {
    const currentTime = new Date()
    jest.spyOn(timeService, 'getNtpTime').mockImplementation(() => currentTime)
    const cert = CertificateBuilderSpec.createCertificate(6)
    const expirationDate = await expirationDateService.getExpirationDateBasedOnCertOrThreshold(pki.certificateToPem(cert), 90)
    const nowPlusThreshold = DateTime.fromJSDate(currentTime).plus({ days: 90 })

    expect(DateTime.fromJSDate(expirationDate).startOf('day').equals(nowPlusThreshold.startOf('day'))).toBeTruthy()
  })
  it('should throw an exception when the certificate expiration date is in the past', async () => {
    const currentTime = new Date()
    jest.spyOn(timeService, 'getNtpTime').mockImplementation(() => currentTime)
    const cert = CertificateBuilderSpec.createCertificate(-1)
    try {
      await expirationDateService.getExpirationDateBasedOnCertOrThreshold(pki.certificateToPem(cert), 90)
      fail()
    } catch (error) {
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(ServiceUnavailableException)
    }
  })
})
