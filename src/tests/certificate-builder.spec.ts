import { DateTime } from 'luxon'
import { pki } from 'node-forge'

/*
 * Mapping of OID and JWS
 * https://www.rfc-editor.org/rfc/rfc7518.html#appendix-A
 * */
const OIDJWSMapping = new Map<string, string>([
  ['1.2.840.113549.2.9', 'HS256'],
  ['1.2.840.113549.2.10', 'HS384'],
  ['1.2.840.113549.2.11', 'HS512'],
  ['1.2.840.113549.1.1.11', 'RS256'],
  ['1.2.840.113549.1.1.12', 'RS384'],
  ['1.2.840.113549.1.1.13', 'RS512'],
  ['1.2.840.10045.4.3.2', 'ES256'],
  ['1.2.840.10045.4.3.3', 'ES384'],
  ['1.2.840.10045.4.3.4', 'ES512'],
  ['1.2.840.113549.1.1.10', 'PS256'],
  ['1.2.840.113549.1.1.10', 'PS384'],
  ['1.2.840.113549.1.1.10', 'PS512']
])

export class CertificateBuilderSpec {
  static createCertificateAndKeyPair(validityThresholdInMonths: number): {
    cert: pki.Certificate
    keypair: pki.KeyPair
  } {
    const cert = pki.createCertificate()
    const keyPair = this.buildKeyPair()

    cert.publicKey = keyPair.publicKey
    cert.serialNumber = '01'
    cert.validity.notBefore = DateTime.now().toJSDate()
    cert.validity.notAfter = DateTime.now().plus({ months: validityThresholdInMonths }).toJSDate()

    const attrs: pki.CertificateField[] = [
      {
        name: 'commonName',
        value: 'dev.gaia-x.eu'
      },
      {
        name: 'countryName',
        value: 'BE'
      }
    ]
    cert.setSubject(attrs)
    cert.setIssuer(attrs)

    cert.sign(keyPair.privateKey)

    return { cert, keypair: keyPair }
  }

  static createCertificate(validityThresholdInMonths: number): pki.Certificate {
    return this.createCertificateAndKeyPair(validityThresholdInMonths).cert
  }

  static buildKeyPair(): pki.rsa.KeyPair {
    return pki.rsa.generateKeyPair(2048)
  }

  static convertToPKCS8(privateKey: pki.PrivateKey): string {
    const asn1PrivateKey = pki.privateKeyToAsn1(privateKey)
    const privateKeyInfo = pki.wrapRsaPrivateKey(asn1PrivateKey)

    return pki.privateKeyInfoToPem(privateKeyInfo)
  }
}

describe('CertificateBuilderForTests', () => {
  it('is used only to generate certs to test enddate for VC issuance', () => {
    // Nothing
  })
})
