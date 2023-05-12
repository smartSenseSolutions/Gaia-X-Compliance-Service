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

   async verify_walt (jws: any, jwk: any, hash: Uint8Array) {
    try {
      const cleanJwk = {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
        x5u: jwk.x5u
      }
      let splited = jws.split(".")
      const algorithm =  'PS256'
      const rsaPublicKey = await jose.importJWK(cleanJwk, algorithm) as jose.KeyLike
     
      const result = await jose.flattenedVerify({
        protected:splited[0],
        signature:splited[2],
        payload:hash
      }, rsaPublicKey)
      return { protectedHeader: result.protectedHeader, content: result.payload }
    } catch (error) {
      console.log(error)
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

  sha256_bytes(input: string): Uint8Array {
    return createHash('sha256').update(input).digest()
  }

  sha512(input: string): string {
    return createHash('sha512').update(input).digest('hex')
  }

  async sign(hash: Uint8Array): Promise<string> {
    const alg = 'PS256'
    let jws
    if (process.env.privateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----')) {
      const rsaPrivateKey = crypto.createPrivateKey(process.env.privateKey)
      jws = await new jose.CompactSign(hash)
        .setProtectedHeader({
          alg,
          b64: false,
          crit: ['b64']
        })
        .sign(rsaPrivateKey)
    } else {
      const rsaPrivateKey = await jose.importPKCS8(process.env.privateKey, alg)
      jws = await new jose.CompactSign(hash)
        .setProtectedHeader({
          alg,
          b64: false,
          crit: ['b64']
        })
        .sign(rsaPrivateKey)
    }

    return jws
  }

  async createComplianceCredential(selfDescription: any): Promise<{ complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> }> {
    const sdJWS = selfDescription.proof.jws
    delete selfDescription.proof
    const normalizedSD: string = await this.normalize(selfDescription)
    const SDhash: string = this.sha256(normalizedSD + sdJWS)
    
    const date = new Date()
    const lifeExpectancy = +process.env.lifeExpectancy || 90
    const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
    const complianceCredentialType: string =
      SelfDescriptionTypes.PARTICIPANT === type ? SelfDescriptionTypes.PARTICIPANT_CREDENTIAL : SelfDescriptionTypes.SERVICE_OFFERING_CREDENTIAL

    const complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
      type: ['VerifiableCredential', complianceCredentialType],
      id: `${process.env.BASE_URL}/${crypto.randomUUID()}`,
      issuer: getDidWeb(),
      issuanceDate: date.toISOString(),
      expirationDate: new Date(date.setDate(date.getDate() + lifeExpectancy)).toISOString(),
      credentialSubject: {
        id: selfDescription.id, 
        hash:SDhash,
        type: 'gx:complianceCredential'
      },
      proof: {
      type: "JsonWebSignature2020",
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      verificationMethod: getDidWeb(),
      jws: ""
      }
    }
    let proof_template = {
      type: "JsonWebSignature2020",
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      verificationMethod: getDidWeb(),
      jws: ""
    }
    delete proof_template.jws
    proof_template["@context"] = complianceCredential["@context"]
    delete complianceCredential.proof
    const normalizedCompliance: string = await this.normalize(complianceCredential)
    const normalizedP:string = await this.normalize(proof_template)
    const hashSD = this.sha256_bytes(normalizedCompliance)
    const hashP = this.sha256_bytes(normalizedP)
    let hash= new Uint8Array(64)
    hash.set(hashP)
    hash.set(hashSD,32)
    const jws = await this.sign(hash)
    proof_template.jws = jws
    delete proof_template["@context"]
    complianceCredential.proof = proof_template
    


    return { complianceCredential }
  }
}
