import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from '../dto'
import crypto, { createHash } from 'crypto'
import { getDidWeb, X509_VERIFICATION_METHOD_NAME } from '../utils'
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { TimeService } from './time.service'
import * as jose from 'jose'
import * as jsonld from 'jsonld'

export interface Verification {
  protectedHeader: jose.CompactJWSHeaderParameters | undefined
  content: string | undefined
}

@Injectable()
export class SignatureService {
  constructor(private readonly timeService: TimeService) {}

  async createComplianceCredential(
    selfDescription: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>>,
    vcid?: string
  ): Promise<VerifiableCredentialDto<ComplianceCredentialDto>> {
    const VCs = selfDescription.verifiableCredential.map(vc => {
      const hash: string = this.sha256(JSON.stringify(vc)) // TODO to be replaced with rfc8785 canonization
      return {
        type: 'gx:compliance',
        id: vc.credentialSubject.id,
        'gx:integrity': `sha256-${hash}`,
        'gx:version': '22.10'
      }
    })

    const issuanceDate = await this.timeService.getNtpTime()
    const lifeExpectancy = +process.env.lifeExpectancy || 90
    const id = vcid ? vcid : `${process.env.BASE_URL}/credential-offers/${crypto.randomUUID()}`
    const complianceCredential: any = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/jws-2020/v1',
        `https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#`
      ],
      type: ['VerifiableCredential'],
      id,
      issuer: getDidWeb(),
      issuanceDate: issuanceDate.toISOString(),
      expirationDate: new Date(issuanceDate.setDate(issuanceDate.getDate() + lifeExpectancy)).toISOString(),
      credentialSubject: VCs
    }

    const VCHash = this.sha256(await this.normalize(complianceCredential))
    const jws = await this.sign(VCHash)
    const proofDate = await this.timeService.getNtpTime()
    complianceCredential.proof = {
      type: 'JsonWebSignature2020',
      created: proofDate.toISOString(),
      proofPurpose: 'assertionMethod',
      jws,
      verificationMethod: `${getDidWeb()}#${X509_VERIFICATION_METHOD_NAME}`
    }
    return complianceCredential
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
      console.log(error)
      throw new BadRequestException('Provided input is not a valid Self Description.', error.message)
    }
    if ('' === canonized) {
      throw new BadRequestException('Provided input is not a valid Self Description.', `Canonized SD is empty ${doc['id']}`)
    }

    return canonized
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
}
