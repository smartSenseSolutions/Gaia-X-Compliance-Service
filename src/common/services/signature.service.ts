import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from '../dto'
import crypto, { createHash } from 'crypto'
import { getDidWeb } from '../utils'
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import * as jose from 'jose'
import * as jsonld from 'jsonld'
import { RegistryService } from './registry.service'
import { getAtomicType } from '../utils/getAtomicType'

enum SelfDescriptionTypes {
  PARTICIPANT = 'LegalParticipant',
  PARTICIPANT_CREDENTIAL = 'gx:ParticipantCredential',
  SERVICE_OFFERING = 'ServiceOffering',
  SERVICE_OFFERING_CREDENTIAL = 'gx:ServiceOfferingCredential'
}

export interface Verification {
  protectedHeader: jose.CompactJWSHeaderParameters | undefined
  content: string | undefined
}

@Injectable()
export class SignatureService {
  constructor(private registryService: RegistryService) {}

  async createComplianceCredential(
    selfDescription: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>>,
    vcid?: string
  ): Promise<VerifiableCredentialDto<ComplianceCredentialDto>> {
    try {
      let credentialSubjectId;
      let compliance_vcs = []
      for(const vc  of selfDescription.verifiableCredential) {
        const type: string = getAtomicType(vc)
        if(type === 'LegalParticipant' || type === 'ServiceOffering') {
          credentialSubjectId = vc.credentialSubject.id
        }
        const sdJWS = vc.proof.jws
        delete vc.proof
        const normalizedSD: string = await this.normalize(vc)
        const SDhash: string = this.sha256(normalizedSD + sdJWS)
        compliance_vcs.push({
          "gx:integrity":"sha256-" + SDhash,
          "gx:version":"22-10" ,
          type:type,
          id:vc.id       })

      }

      const id = vcid ? vcid : `${process.env.BASE_URL}/credential-offers/${crypto.randomUUID()}`
      const date = new Date()
      const lifeExpectancy = +process.env.lifeExpectancy || 90
      const complianceCredential: any = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          `${await this.registryService.getBaseUrl()}/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#`,
          'https://w3id.org/security/suites/jws-2020/v1'
        ],
        type: ['VerifiableCredential'],
        id,
        issuer: getDidWeb(),
        issuanceDate: date.toISOString(),
        expirationDate: new Date(date.setDate(date.getDate() + lifeExpectancy)).toISOString(),
        credentialSubject: {
          id: credentialSubjectId,
          type:'gx:compliance',
          "gx:compliant": compliance_vcs
        },
        proof: {
          type: 'JsonWebSignature2020',
          created: new Date().toISOString(),
          proofPurpose: 'assertionMethod',
          verificationMethod: getDidWeb(),
          jws: ''
        }
      }
      const proof_template = {
        type: 'JsonWebSignature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: getDidWeb(),
        jws: ''
      }
      delete proof_template.jws
      proof_template['@context'] = complianceCredential['@context']
      delete complianceCredential.proof
      const normalizedCompliance: string = await this.normalize(complianceCredential)

      const normalizedP: string = await this.normalize(proof_template)
      const hashSD = this.sha256_bytes(normalizedCompliance)
      const hashP = this.sha256_bytes(normalizedP)
      const hash = new Uint8Array(64)
      hash.set(hashP)
      hash.set(hashSD, 32)
      const jws = await this.sign(hash)
      proof_template.jws = jws
      delete proof_template['@context']
      complianceCredential.proof = proof_template
      return complianceCredential
    } catch (e) {
      console.log(e)
    }
  }

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
    let canonized: string
    try {
      canonized = await jsonld.canonize(doc, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads'
      })
    } catch (error) {
      throw new BadRequestException('Provided input is not a valid Self Description.', error.message)
    }
    if ('' === canonized) {
      throw new BadRequestException('Provided input is not a valid Self Description.', 'Canonized SD is empty')
    }

    return canonized
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

  async verify_walt(jws: any, jwk: any, hash: Uint8Array) {
    try {
      const cleanJwk = {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
        x5u: jwk.x5u
      }
      const splited = jws.split('.')
      const algorithm = 'PS256'
      const rsaPublicKey = (await jose.importJWK(cleanJwk, algorithm)) as jose.KeyLike

      const result = await jose.flattenedVerify(
        {
          protected: splited[0],
          signature: splited[2],
          payload: hash
        },
        rsaPublicKey
      )
      return { protectedHeader: result.protectedHeader, content: result.payload }
    } catch (error) {
      throw new ConflictException('Verification for the given jwk and jws failed.')
    }
  }
}
