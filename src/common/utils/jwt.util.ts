import * as jose from 'jose'
import crypto from 'crypto'
import { getDidWeb } from './did.util'

const alg = 'RS256'

export async function signJWT(sourceCredential, payload, subject = undefined) {
  const privateKey = process.env.privateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----')
    ? crypto.createPrivateKey(process.env.privateKey)
    : await jose.importPKCS8(process.env.privateKey, alg)

  const issuer = getDidWeb()
  const issuance = (sourceCredential.issuanceDate && new Date(sourceCredential.issuanceDate)) || new Date()
  const exp = (sourceCredential.expirationDate && new Date(sourceCredential.expirationDate)) || new Date(issuance.getTime() + 60 * 60 * 1000)

  const sign = new jose.SignJWT(payload)
    .setProtectedHeader({ alg, typ: 'JWT' })
    .setIssuedAt(Math.trunc(issuance.getTime() / 1000))
    .setExpirationTime(Math.trunc(exp.getTime() / 1000))
    .setIssuer(issuer)

  if (subject) {
    sign.setSubject(subject)
    /**
     * https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.3
     * Audience claim is mandatory, but not its usage. Should identify the recipients.
     */
    sign.setAudience(subject)
  }

  return await sign.sign(privateKey)
}
