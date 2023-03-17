import { ComplianceCredentialDto, VerifiableCredentialDto } from '../dto'
import crypto, { createHash } from 'crypto'
import { getDidWeb } from '../utils'
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import * as jose from 'jose'
import * as jsonld from 'jsonld'
import { SelfDescriptionTypes } from '../enums'

export interface Verification {
  protectedHeader: jose.CompactJWSHeaderParameters | undefined
  content: string | undefined
}

@Injectable()
export class SignatureService {
  async verify(jws: any, jwk: any): Promise<Verification> {
    try {
      const cleanJwk = {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
        x5u: jwk.x5u
      }
      const algorithm = jwk.alg || 'PS256'
      const rsaPublicKey = await jose.importJWK(cleanJwk, algorithm)

      const result = await jose.compactVerify(jws, rsaPublicKey)

      return { protectedHeader: result.protectedHeader, content: new TextDecoder().decode(result.payload) }
    } catch (error) {
      throw new ConflictException('Verification for the given jwk and jws failed.')
    }
  }

  async normalize(doc: object): Promise<string> {
    try {
      const canonized: string = await jsonld.canonize(doc, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads'
      })
      if (canonized === '') throw new Error('Canonized SD is empty')

      return canonized
    } catch (error) {
      console.log(error)
      throw new BadRequestException('Provided input is not a valid Self Description.', error.message)
    }
  }

  sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex')
  }

  sha512(input: string): string {
    return createHash('sha512').update(input).digest('hex')
  }

  async sign(hash: string): Promise<string> {
    const alg = 'PS256'
    let jws
    if (process.env.privateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----')) {
      const rsaPrivateKey = crypto.createPrivateKey(process.env.privateKey)
      jws = await new jose.CompactSign(new TextEncoder().encode(hash))
        .setProtectedHeader({
          alg,
          b64: false,
          crit: ['b64']
        })
        .sign(rsaPrivateKey)
    } else {
      const rsaPrivateKey = await jose.importPKCS8(process.env.privateKey, alg)
      jws = await new jose.CompactSign(new TextEncoder().encode(hash))
        .setProtectedHeader({
          alg,
          b64: false,
          crit: ['b64']
        })
        .sign(rsaPrivateKey)
    }

    return jws
  }

  // https://gaia-x.gitlab.io/technical-committee/federation-services/icam/credential_format/#identifiers
  async createComplianceCredential(selfDescription: any): Promise<{ complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> }> {
    const sdJWS = selfDescription.proof.jws
    delete selfDescription.proof
    const normalizedSD: string = await this.normalize(selfDescription)
    const hash: string = this.sha256(normalizedSD + sdJWS) // TODO: replace normalisation method with rfc8785
    const jws = await this.sign(hash)
    const date = new Date()
    const lifeExpectancy = +process.env.lifeExpectancy || 90


    const complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> = {
      '@context': ['https://www.w3.org/2018/credentials/v1'], // TODO: add gx context
      type: ['VerifiableCredential'],
      id: `${process.env.COMPLIANCE_URL}/${process.env.COMPLIANCE_CREDENTIAL_ENDPOINT}/${crypto.randomUUID()}`,
      issuer: getDidWeb(),
      issuanceDate: date.toISOString(),
      expirationDate:new Date(date.setDate(date.getDate()+lifeExpectancy)).toISOString(),
      credentialSubject: [{ // TODO: add support for an array of credentials, with one for each verified credential, including nested ones.
        type: "gx:complianceCredential", // TODO: add complianceCredential in gaia-x schema
        id: selfDescription.credentialSubject.id,
        integrity: `sha256-${hash}` // replacing old hash attribute with Subresource Integrity specs
      }],
      proof: {
        type: 'JsonWebSignature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        jws,
        verificationMethod: getDidWeb()
      }
    }

    return { complianceCredential }
  }
}
