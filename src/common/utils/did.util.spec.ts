import * as jose from 'jose'
import * as process from 'process'
import { writeFileSync } from 'fs'
import { importX509, KeyLike } from 'jose'
import { createDidDocument, DID_DOC_FILE_PATH, DID_DOC_FILE_PATH_WK, getDidWeb, X509_VERIFICATION_METHOD_NAME } from './did.util'

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

describe('DidUtil', () => {
  let baseUrl: string

  beforeEach(() => {
    baseUrl = process.env.BASE_URL
    process.env.BASE_URL = 'https://gaia-x.eu:1234/testing'
    ;(writeFileSync as jest.Mock).mockReset()
  })

  afterEach(() => {
    process.env.BASE_URL = baseUrl
  })

  it('should build a DID document and save it to the filesystem', async () => {
    const certificate: KeyLike = await importX509(rawCertificate, null)

    await createDidDocument(certificate, 'PS256')

    expect(writeFileSync).toHaveBeenCalledWith(DID_DOC_FILE_PATH, expect.any(String))
    expect(writeFileSync).toHaveBeenCalledWith(DID_DOC_FILE_PATH_WK, expect.any(String))

    const writtenData: string = (writeFileSync as jest.Mock).mock.calls[0][1]
    const data = JSON.parse(writtenData)

    expect(data).toEqual({
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
      id: getDidWeb(),
      verificationMethod: [
        {
          '@context': 'https://w3c-ccg.github.io/lds-jws2020/contexts/v1/',
          id: `did:web:gaia-x.eu%3A1234:testing#${X509_VERIFICATION_METHOD_NAME}`,
          type: 'JsonWebKey2020',
          controller: 'did:web:gaia-x.eu%3A1234:testing',
          publicKeyJwk: {
            ...(await jose.exportJWK(certificate)),
            alg: 'PS256',
            x5u: 'https://gaia-x.eu:1234/testing/.well-known/x509CertificateChain.pem'
          }
        }
      ],
      assertionMethod: [`did:web:gaia-x.eu%3A1234:testing#${X509_VERIFICATION_METHOD_NAME}`]
    })

    expect(JSON.parse((writeFileSync as jest.Mock).mock.calls[1][1])).toEqual(data)
  })
})
