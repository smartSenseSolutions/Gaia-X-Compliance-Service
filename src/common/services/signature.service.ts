import { Injectable } from '@nestjs/common'
import * as jose from 'jose'
import { createHash } from 'crypto'
import * as jsonld from 'jsonld'
import { WrappedComplianceCredentialDto } from '../../participant/dto/participant-sd.dto'
import { getDidWeb } from '../utils/did.util'
import { ComplianceCredentialDto } from '../dto/compliance-credential.dto'
import { VerifiableCredentialDto } from '../dto/credential-meta.dto'
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

  // TODO refactor
  async createComplianceCredential(
    selfDescription,
    proof_jws: string
  ): Promise<{ complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> }> {
    const normalizedSD = await this.normalize(selfDescription)
    const hash = this.sha256(normalizedSD)

    const jws = await this.sign(hash)

    const credentialSubject = {
      id: selfDescription.credentialSubject.id,
      hash
    }

    const proof = {
      type: 'JsonWebKey2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      jws,
      verificationMethod: getDidWeb()
    }

    const types = {
      PARTICIPANT: 'gx-participant:LegalPerson',
      SERVICE_OFFERING: 'gx-service-offering:ServiceOfferingExperimental'
    }

    const credentialTypes = {
      PARTICIPANT: 'ParticipantCredential',
      SERVICE_OFFERING: 'ServiceOfferingCredentialExperimental'
    }

    const type = selfDescription['@type'].find(t => t !== 'VerifiableCredential')
    const complianceCredentialType = types.PARTICIPANT === type ? credentialTypes.PARTICIPANT : credentialTypes.SERVICE_OFFERING

    const complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      '@type': ['VerifiableCredential', complianceCredentialType],
      id: `https://catalogue.gaia-x.eu/credentials/${complianceCredentialType}/${new Date().getTime()}`,
      issuer: getDidWeb(),
      issuanceDate: new Date().toISOString(),
      credentialSubject,
      proof
    }

    return { complianceCredential }
  }
}
