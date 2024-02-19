import { readFileSync, writeFileSync } from 'fs'
import { KeyLike } from 'jose'
import { CertificateUtil } from './certificate.util'

const rawCertificate = `-----BEGIN CERTIFICATE-----
MIIDDzCCAfegAwIBAgIULRioPSg8ZC5oViZExbhEe/g1srAwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI0MDIwNjE0MjU1NFoXDTI0MDMw
NzE0MjU1NFowFDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAtWFIjhNMdgZHuURilFy4SqUowE0XuLxzq6PCmMJVatpM
ER/Y/4FmxrxCgxFW1bvZdaPv0AWcz/Ax3dovPdhqjtnU7k4/r2IilF4iOjNiBYO/
tXEl6SatNdLzUqfKPemXVpjTXc8/rI5f5K4zAtBSFoVm2ryL8MR2H/iwYFWFFPZr
6qfRlLma68ami5lZpW+OITrdDldaBPHqMKm4BKP5W1wQZ4FRXR672YEN07nidroX
K/i6LsL7DSti+UclMwasd6nPxPJBoFP8uHqj+DOEtoN+s1A7hMVLs0o5kT/waHZw
3Qy8Fe9p7k1xDvBox7y/3vHwScQjcZJsX/mDrEpmBQIDAQABo1kwVzAUBgNVHREE
DTALgglsb2NhbGhvc3QwCwYDVR0PBAQDAgeAMBMGA1UdJQQMMAoGCCsGAQUFBwMB
MB0GA1UdDgQWBBQthupZlAga8HmJdii1q6XwEi6yjzANBgkqhkiG9w0BAQsFAAOC
AQEAaiszX6s84S9WBvcoTdmbTbkB0/7ETXlKEgXD54LL2KIRYTbrFu8XikuUSEda
r9Aa9TYzEWh+7aFywP2BiP3dHaVqXYVthhp93gJHS7fsDerx1oqIyUsiccvYabYy
BnnHuJcSRCcnMOaQYRz5/r7y6z/b5D+S5f97N8RtSue2F6W2obhtKpds/qfrJjbj
cL8BSiHeENWwn0CO72lQo4BXDQs7ogqim9AsfsoybE+CocKzFwLnFlBU25od9iwo
wjpY/jg60C/CWSpCiWOACPPky3Fw6sdVT6GttecybjY5dje5kBJTnI0mZZjkoRhe
N5HAoD77V9p0U/KHFsR+8XYTPg==
-----END CERTIFICATE-----`

jest.mock('fs')

describe('CertificateUtil', () => {
  beforeEach(() => {
    ;(writeFileSync as jest.Mock).mockReset()
    ;(readFileSync as jest.Mock).mockReset()
  })

  it('should write input certificate to filesystem and import it', async () => {
    const result: KeyLike = await CertificateUtil.loadCertificate(rawCertificate)

    expect(result).not.toBeNull()
    expect(writeFileSync).toHaveBeenCalledWith(CertificateUtil.X509_CERTIFICATE_CHAIN_FILE_PATH, rawCertificate)
    expect(readFileSync).not.toHaveBeenCalled()
  })

  it('should read certificate from filesystem and import it when input certificate is not provided', async () => {
    ;(readFileSync as jest.Mock).mockReturnValue(rawCertificate)

    const result: KeyLike = await CertificateUtil.loadCertificate(null)

    expect(result).not.toBeNull()
    expect(writeFileSync).not.toHaveBeenCalled()
    expect(readFileSync).toHaveBeenCalledWith(CertificateUtil.X509_CERTIFICATE_CHAIN_FILE_PATH, 'utf-8')
  })

  it('should throw an exception when the certificate is invalid', () => {
    expect(() => CertificateUtil.loadCertificate('invalid_format')).rejects.toThrow('"x509" must be X.509 formatted string')
  })
})
