import { Injectable } from '@nestjs/common'
import * as jose from 'jose'
import { createHash } from 'crypto'
import * as jsonld from 'jsonld'
import { WrappedComplianceCredentialDto } from '../../participant/dto/participant-sd.dto'
export interface Verification {
  protectedHeader: jose.CompactJWSHeaderParameters | undefined
  content: string | undefined
}

@Injectable()
export class SignatureService {
  async verify(jws: any, jwk: any): Promise<Verification> {
    try {
      const algorithm = 'PS256'
      const rsaPublicKey = await jose.importJWK(jwk, algorithm)

      const result = await jose.compactVerify(jws, rsaPublicKey)

      return { protectedHeader: result.protectedHeader, content: new TextDecoder().decode(result.payload) }
    } catch (error) {
      return { protectedHeader: undefined, content: undefined }
    }
  }

  async normalize(doc: object) {
    const canonized = await jsonld.canonize(doc, {
      algorithm: 'URDNA2015',
      format: 'application/n-quads'
    })

    return canonized
  }

  sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex')
  }

  async sign(hash: string): Promise<string> {
    const alg = 'PS256'
    const rsaPrivateKey = await jose.importPKCS8(process.env.privateKey, alg)

    const jws = await new jose.CompactSign(new TextEncoder().encode(hash)).setProtectedHeader({ alg, b64: false, crit: ['b64'] }).sign(rsaPrivateKey)

    return jws
  }

  async createComplianceCredential(selfDescription, proof_jws: string): Promise<WrappedComplianceCredentialDto> {
    const normalizedSD = await this.normalize(selfDescription)
    const hash = this.sha256(normalizedSD + proof_jws)
    const jws = await this.sign(hash)

    const credentialSubject = {
      id: selfDescription['@id'],
      hash
    }

    const proof = {
      type: 'JsonWebKey2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      jws,
      verificationMethod: `did:web:${process.env.BASE_URL.replace(/http[s]?:\/\//, '')}`
    }

    return { complianceCredential: { credentialSubject, proof } }
  }
}
