import { HttpModule, HttpService } from '@nestjs/axios'
import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as process from 'process'
import { DidResolver, GaiaXSignatureVerifier, JsonWebSignature2020Verifier, SignatureValidationException } from '@gaia-x/json-web-signature-2020'
import { importJWK } from 'jose'
import { of } from 'rxjs'
import { ProofService, RegistryService, TimeService } from '.'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { CommonModule } from '../common.module'
import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from '../dto'
import { OutputVerifiableCredentialMapperFactory } from '../mapper/output-verifiable-credential-mapper.factory'
import { X509_VERIFICATION_METHOD_NAME } from '../utils'

const didResolverMock = {
  resolve: jest.fn()
}

const httpServiceMock = {
  get: jest.fn()
}

const registryServiceMock = {
  isValidCertificateChain: jest.fn()
}

const privateKeyJwk = {
  alg: 'PS256',
  kty: 'RSA',
  n: '2AKm73KFalgCZq57KUHbX70fFmVScGB_Pa6_T4_f4YQDENyI2TWyhFu1HABXnHoZmP_JBouHhKkRg7-QPKidOOE1yyrutjmBHZ8sGI2j9KGTqsMna4DU7sOfWoqrlJWc8-RGi5z58uO3vA2zEoNh0qpoDuKGaqtSX2efzChH6mAnmhEu-4JcixkNES8AzcYX1UB5fPu4Vs64gIRgbke0h8f0riFbh5RjkM0eMka9RV0iLjU1j24Y59EE8DbAlHTM5JtHxlo6Hv5_iiw-WiFEcuEobneFIGQP6WiJq5Fql2vV7X7YEzV5ydQjuRCy4hDW_i6JEt0Y5qlP1AoYeb-isw',
  e: 'AQAB',
  d: 'TnioLFRuIzPVq3e3RkWmbCFIKdqlGC32C3JwDXc23bYXZwi2rjHTqEGoiYOWUEILConhfX8yu_6vXi05ONAITaGC6UuvbIN3ZEtuuXy7EyOfgWlj6KnksNhgC4RU0KWJXxCOkCl2o8YV-TsA0rjn0KAXLVEdg6K5Se9bHc-EUJ_y4lfiI7wR2gfoHGo3K2_44Xwf1guwceYVBKLyvZ5-861SzFg1WkASRSdMKpMrFH_CUgK3guvTtgDyMm_zWj_WGVZcU_m3zG7TOvykr569bYdb4MJstWUeqNzurjmMeTlajo9LaYNN6dHhKDM_kcoj85s4Qk-aKqUFbzZwxx6h',
  p: '7u3mH0Xux2JOmjT1Q32R-zwKomEGrjLPqNxDYLFG7NMCha_07rc2rsHTROtJwrM-K5CVW7Y1U_iFe5FP6AKCu056vMyi_ktz78KR7FjnuBAaRJx9UAQ0qscy_hsFmsZde7eS-Q4xMPOqpqL7CK5e62QfenCM4cTkMFVNPqYyt5E',
  q: '53GOzFDHTrpoBFy3duMNLv3NOVKK_ceJ_1q0tGCaR4K_K56-TJ2OFnkGDLKxvDVx_J5CKD1QnKgw9CxMSgJBYHSd5rw7PHLIKBqzcS9LpQcy1O_uXRyufcHpl9TuRwM63vFXooms-paCJRBcHnLnBRagelwJBwWQThK9MfBJvAM',
  dp: 'y8Fjew33aF9kqss40dp3MKpuYzWdLdc1EkrsxrvHwVTdlMaOeTkTUAsJMX_5wil7fklppfGIHtkUdGFipHfnpvZxYyqcYYJVF4V1Tfoved95l0Ng9mjvxSflS6AdsnUx6byOgQhiWN2jjUH2FNwnJFSZJ6Bt9GclNja4jhHLtJE',
  dq: 'TBGCwZx7JWEW9vgSRLzzhFJetUxv6mE-9fK2GeL2UjKi6o9ONJhELxav6lSBHj7irAjH7bnZWOPe0yIMIPcEzdMGYuPTBFcleijseXL2BdOL3XjOe0QGBcdKI2EUv7pMCyJ_jyh49hOpyszJuihBzeZV8GF3hhtKBp8aF-PGGEk',
  qi: 'qUGUPkS0MPP4BhSULbfNJxuA7sQYf2VN0iIPxNks_rjYkdUqXXZj4hvdRbYjRThDHkIlXItpZcQvfXiNaVUCP61E01s05q7nRZYctIsONdbJLt2gcQgbYIJqXQxhjXagWvDngnSikf3w_zx-sTuEnubZftiWgu3XRbHgDDDMJQo'
}

const certificateRaw: string =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIIDmTCCAoGgAwIBAgIUb5XHRsa2R2DbB8djidTTTdXaXsUwDQYJKoZIhvcNAQEL\n' +
  'BQAwXDELMAkGA1UEBhMCRlIxDDAKBgNVBAgMA05BUTEPMA0GA1UEBwwGUGVzc2Fj\n' +
  'MQ8wDQYDVQQKDAZHYWlhLVgxHTAbBgNVBAMMFGNvbXBsaWFuY2UuZ2FpYS14LmV1\n' +
  'MB4XDTI0MDIwNzE1MTMwNFoXDTI0MDMwODE1MTMwNFowXDELMAkGA1UEBhMCRlIx\n' +
  'DDAKBgNVBAgMA05BUTEPMA0GA1UEBwwGUGVzc2FjMQ8wDQYDVQQKDAZHYWlhLVgx\n' +
  'HTAbBgNVBAMMFGNvbXBsaWFuY2UuZ2FpYS14LmV1MIIBIjANBgkqhkiG9w0BAQEF\n' +
  'AAOCAQ8AMIIBCgKCAQEA2AKm73KFalgCZq57KUHbX70fFmVScGB/Pa6/T4/f4YQD\n' +
  'ENyI2TWyhFu1HABXnHoZmP/JBouHhKkRg7+QPKidOOE1yyrutjmBHZ8sGI2j9KGT\n' +
  'qsMna4DU7sOfWoqrlJWc8+RGi5z58uO3vA2zEoNh0qpoDuKGaqtSX2efzChH6mAn\n' +
  'mhEu+4JcixkNES8AzcYX1UB5fPu4Vs64gIRgbke0h8f0riFbh5RjkM0eMka9RV0i\n' +
  'LjU1j24Y59EE8DbAlHTM5JtHxlo6Hv5/iiw+WiFEcuEobneFIGQP6WiJq5Fql2vV\n' +
  '7X7YEzV5ydQjuRCy4hDW/i6JEt0Y5qlP1AoYeb+iswIDAQABo1MwUTAdBgNVHQ4E\n' +
  'FgQU4P6iTnO5b5O5gsjPSpK+6g0AhN4wHwYDVR0jBBgwFoAU4P6iTnO5b5O5gsjP\n' +
  'SpK+6g0AhN4wDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAba6B\n' +
  'zqmBSfZIgWisXChHTF031ZylWDJ12nPz0PV0j4X+CKRYgRCJYE+JR4gFfkHZRGnM\n' +
  'RSScwQwBiIA1w5H1yJ1/OAosuxhwbu6XV8Z4f0BKoMShP9MeIcCeCBcDjxTBk0lf\n' +
  'hYudeh72i/NJfsNJC3oD+Oj2wkyWgT+dOrSHywm/HCioceNW14cY0Efxu4Y0Kdjh\n' +
  '5fpEBzLSabJklozCscuKfmuhQssy+97DN/yaqZ4ryapI2p2v9sZu41MkVc2wj18k\n' +
  'CW1aQ8klL/uU4bhyVOUkVTtFgEU+5RM+2b+RWAquxOCXPQzN6OEHh1rw004MvJE8\n' +
  'V/npm/ah2Zeaw76nhQ==\n' +
  '-----END CERTIFICATE-----\n'

const gaiaXVerifiableCredential: VerifiableCredentialDto<ParticipantSelfDescriptionDto> = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/suites/jws-2020/v1',
    'https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#'
  ],
  type: ['VerifiableCredential'],
  id: 'https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc?vcid=brown-horse',
  issuer:
    'did:web:wizard.lab.gaia-x.eu:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc',
  issuanceDate: '2023-07-12T08:58:07.859Z',
  credentialSubject: {
    type: 'gx:LegalParticipant',
    registrationNumber: [
      {
        type: 'vatID',
        number: 'FR123456789'
      }
    ],
    headquarterAddress: {
      countrySubdivisionCode: 'BE-BRU'
    },
    legalAddress: {
      countrySubdivisionCode: 'BE-BRU'
    },
    id: 'https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc#9894e9b0a38aa105b50bb9f4e7d0975641273416e70f166f4bd9fd1b00dfe81d'
  },
  proof: {
    type: 'JsonWebSignature2020',
    created: '2024-02-15T11:42:44.324+01:00',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:web:example.org#X509-JWK2020',
    jws: 'eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..cbHf6NxuB_V941293NWNqIJZSOVdKxMLC_wEYxVuyl4vsBJpyWwQ4owiM8MSoTGUOddt_PBBvVNj3i4RS0_b18rLkvzaODmUKQeOmFcmTfjiG2DLHNHXNo58n7bKPq3iSPhyPTySLHT7VRYEinmXv-viHNZOCi2Xo_U9rtBHLnwZGyKczyzBsdxL8UtI1w3t42Rqtv3uP6u8oaBK9Q7pXuei0Jw5aXmqYKDZC_gNYblvsZoHbayvVkNg7ajh2tWju53XxMKP8z8cnEeM-RNiheWjdhulgpf1LyEqnaPT5hcXv8VKAdhn86-h2cC-odShUHqTa74TJjMCRB5JX7YVgw'
  }
}

const verifiableCredential: VerifiableCredentialDto<ParticipantSelfDescriptionDto> = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/suites/jws-2020/v1',
    'https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#'
  ],
  type: ['VerifiableCredential'],
  id: 'https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc?vcid=brown-horse',
  issuer:
    'did:web:wizard.lab.gaia-x.eu:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc',
  issuanceDate: '2023-07-12T08:58:07.859Z',
  credentialSubject: {
    type: 'gx:LegalParticipant',
    registrationNumber: [
      {
        type: 'vatID',
        number: 'FR123456789'
      }
    ],
    headquarterAddress: {
      countrySubdivisionCode: 'BE-BRU'
    },
    legalAddress: {
      countrySubdivisionCode: 'BE-BRU'
    },
    id: 'https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DFPWTYo5iRYkn8kvgU3AjMXc2qTbhuMHCpucKGgT1ZMkcHUygZkt11iD3T8VJNKYwsdk4MGoZwdqoFUuTKVcsXVTBA4ofD1Dtqzjavyng5WUpvJf4gRyfGkMvYYuHCgay8TK8Dayt6Rhcs3r2d1gRCg2UV419S9CpWZGwKQNEXdYbaB2eTiNbQ83KMd4mj1oSJgF7LLDZLJtKJbhwLzR3x35QUqEGevRxnRDKoPdHrEZN7r9TVAmvr9rt7Xq8eB4zGMTza59hisEAUaHsmWQNaVDorqFyZgN5bXswMK1irVQ5SVR9osCCRrKUKkntxfakjmSqapPfveMP39vkgTXfEhsfLUZXGwFcpgLpWxWRn1QLnJY11BVymS7DyaSvbSKotNFQxyV6vghfM2Jetw1mLxU5qsQqDYnDYJjPZQSmkwxjX3yenPVCz6N2ox83tj9AuuQrzg5p2iukNdunDd2QCsHaMEtTq9JVLzXtWs2eZbPkxCBEQwoKTGGVhKu5yxZjCtQGc#9894e9b0a38aa105b50bb9f4e7d0975641273416e70f166f4bd9fd1b00dfe81d'
  },
  proof: {
    type: 'JsonWebSignature2020',
    created: '2024-02-15T11:41:19.666+01:00',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:web:example.org#X509-JWK2020',
    jws: 'eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..zNRgZhLAD4GOYWPCwIjnJD9N3EC_gQHTbOyieMIq3yGoWLw3h932qMU0E6630gkmna2WFNLeUFMtYlDnj5AhTHnOrPfKv_gN-cjjrDNGgJusNatYATTp8dcRXdLygJNhMjynXNlPPVOu5kWoMtolG0qVwG1nrrEkCZjzPiWUgBr9WGYVGf_6vIdlgXPcveVR9X08W708weloGASKg7_yHb0oyqlhwliYpyAnOOiAE1P6qmkP5euHhqaOaXTJzkRfumWYoJPyc1qGGMsbOQavE5mLJT9eGc1tpc-149qiW7a5M4W8n4OdhLQ2WxsaSIanT-s6wsgOOGzBMMAsVu99gA'
  }
}

const mockedNtpTime: Date = new Date('2024-02-08T10:39:45.841Z')

describe('ProofService', () => {
  let originalBaseUrl: string
  let originalLifeExpectancy: string

  let proofService: ProofService
  let timeService: TimeService
  let gaiaXSignatureVerifier: GaiaXSignatureVerifier
  let jsonWebSignature2020Verifier: JsonWebSignature2020Verifier

  beforeAll(async () => {
    originalBaseUrl = process.env.BASE_URL
    originalLifeExpectancy = process.env.lifeExpectancy

    process.env.BASE_URL = 'https://example.org'
    process.env.lifeExpectancy = '12'
    process.env.WEB_DOCUMENT_LOADER = 'true'

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule]
    })
      .overrideProvider(DidResolver)
      .useValue(didResolverMock)
      .overrideProvider(HttpService)
      .useValue(httpServiceMock)
      .overrideProvider(RegistryService)
      .useValue(registryServiceMock)
      .overrideProvider('privateKey')
      .useValue(await importJWK(privateKeyJwk))
      .compile()

    proofService = moduleFixture.get<ProofService>(ProofService)
    timeService = moduleFixture.get<TimeService>(TimeService)
    gaiaXSignatureVerifier = moduleFixture.get<GaiaXSignatureVerifier>(GaiaXSignatureVerifier)
    jsonWebSignature2020Verifier = moduleFixture.get<JsonWebSignature2020Verifier>(JsonWebSignature2020Verifier)

    jest.spyOn(gaiaXSignatureVerifier, 'verify')
    jest.spyOn(jsonWebSignature2020Verifier, 'verify')

    jest.spyOn(timeService, 'getNtpTime').mockResolvedValue(mockedNtpTime)
  })

  afterAll(() => {
    process.env.BASE_URL = originalBaseUrl
    process.env.lifeExpectancy = originalLifeExpectancy
  })

  beforeEach(() => {
    jest.spyOn(didResolverMock, 'resolve').mockImplementation(async () => {
      return {
        '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
        id: 'did:web:example.org',
        verificationMethod: [
          {
            id: `did:web:example.org#${X509_VERIFICATION_METHOD_NAME}`,
            type: 'JsonWebKey2020',
            controller: 'did:web:example.org',
            publicKeyJwk: {
              alg: 'PS256',
              kty: 'RSA',
              n: '2AKm73KFalgCZq57KUHbX70fFmVScGB_Pa6_T4_f4YQDENyI2TWyhFu1HABXnHoZmP_JBouHhKkRg7-QPKidOOE1yyrutjmBHZ8sGI2j9KGTqsMna4DU7sOfWoqrlJWc8-RGi5z58uO3vA2zEoNh0qpoDuKGaqtSX2efzChH6mAnmhEu-4JcixkNES8AzcYX1UB5fPu4Vs64gIRgbke0h8f0riFbh5RjkM0eMka9RV0iLjU1j24Y59EE8DbAlHTM5JtHxlo6Hv5_iiw-WiFEcuEobneFIGQP6WiJq5Fql2vV7X7YEzV5ydQjuRCy4hDW_i6JEt0Y5qlP1AoYeb-isw',
              e: 'AQAB',
              x5u: 'https://example.org/.well-known/cert.crt'
            }
          }
        ],
        assertionMethod: [`did:web:example.org#${X509_VERIFICATION_METHOD_NAME}`]
      }
    })

    jest.spyOn(httpServiceMock, 'get').mockImplementation(() => {
      return of({
        data: certificateRaw,
        headers: {
          'Content-type': 'application/pkcs8'
        }
      })
    })

    jest.spyOn(registryServiceMock, 'isValidCertificateChain').mockReturnValue(true)
  })

  afterEach(() => {
    ;(gaiaXSignatureVerifier.verify as jest.Mock).mockReset()
    ;(jsonWebSignature2020Verifier.verify as jest.Mock).mockReset()
  })

  it('should be defined', () => {
    expect(proofService).toBeDefined()
  })

  it('should return true when Gaia-X signed verifiable credential is valid', async () => {
    await proofService.validate(gaiaXVerifiableCredential)

    expect(didResolverMock.resolve).toHaveBeenCalledWith('did:web:example.org')
    expect(httpServiceMock.get).toHaveBeenCalledWith('https://example.org/.well-known/cert.crt')
    expect(registryServiceMock.isValidCertificateChain).toHaveBeenCalledWith(certificateRaw.replaceAll(/\n/g, ''))
    expect(gaiaXSignatureVerifier.verify).toHaveBeenCalledWith(gaiaXVerifiableCredential)
    expect(jsonWebSignature2020Verifier.verify).not.toHaveBeenCalled()
  })

  it('should return true when JsonWebSignature2020 signed verifiable credential is valid', async () => {
    await proofService.validate(verifiableCredential)

    expect(didResolverMock.resolve).toHaveBeenCalledWith('did:web:example.org')
    expect(httpServiceMock.get).toHaveBeenCalledWith('https://example.org/.well-known/cert.crt')
    expect(registryServiceMock.isValidCertificateChain).toHaveBeenCalledWith(certificateRaw.replaceAll(/\n/g, ''))
    expect(gaiaXSignatureVerifier.verify).toHaveBeenCalledWith(verifiableCredential)
    expect(jsonWebSignature2020Verifier.verify).toHaveBeenCalledWith(verifiableCredential)
  })

  it('should throw an exception when Gaia-X signature verifier exception is not of ConflictException type', async () => {
    const exception = new ConflictException('Verification failed: Test exception')
    jest.spyOn(gaiaXSignatureVerifier, 'verify').mockRejectedValue(exception)

    try {
      await proofService.validate(verifiableCredential)
    } catch (e) {
      expect(e).toEqual(exception)

      expect(didResolverMock.resolve).toHaveBeenCalledWith('did:web:example.org')
      expect(httpServiceMock.get).toHaveBeenCalledWith('https://example.org/.well-known/cert.crt')
      expect(registryServiceMock.isValidCertificateChain).toHaveBeenCalledWith(certificateRaw.replaceAll(/\n/g, ''))
      expect(gaiaXSignatureVerifier.verify).toHaveBeenCalledWith(verifiableCredential)
      expect(jsonWebSignature2020Verifier.verify).not.toHaveBeenCalled()

      return
    }

    throw new Error()
  })

  it('should throw an exception if signature cannot be verified by both verifiers', async () => {
    const exception = new SignatureValidationException('Test exception')
    jest.spyOn(gaiaXSignatureVerifier, 'verify').mockRejectedValue(exception)
    jest.spyOn(jsonWebSignature2020Verifier, 'verify').mockRejectedValue(exception)

    try {
      await proofService.validate(verifiableCredential)
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictException)
      expect(e.message).toEqual(
        'The signature of the document with ID Test exception cannot be validated, please check the document has not been tampered'
      )

      expect(didResolverMock.resolve).toHaveBeenCalledWith('did:web:example.org')
      expect(httpServiceMock.get).toHaveBeenCalledWith('https://example.org/.well-known/cert.crt')
      expect(registryServiceMock.isValidCertificateChain).toHaveBeenCalledWith(certificateRaw.replaceAll(/\n/g, ''))
      expect(gaiaXSignatureVerifier.verify).toHaveBeenCalledWith(verifiableCredential)
      expect(jsonWebSignature2020Verifier.verify).toHaveBeenCalledWith(verifiableCredential)

      return
    }

    throw new Error()
  })

  it('should create a compliance credential', async () => {
    const verifiablePresentation: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>> = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      '@type': ['VerifiablePresentation'],
      verifiableCredential: [gaiaXVerifiableCredential]
    }

    const result: VerifiableCredentialDto<ComplianceCredentialDto> = await proofService.createComplianceCredential(verifiablePresentation)

    expect(result).toEqual({
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/jws-2020/v1',
        `https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#`
      ],
      type: ['VerifiableCredential'],
      id: expect.stringMatching(new RegExp(`${process.env.BASE_URL}/credential-offers/.+`)),
      issuer: 'did:web:example.org',
      issuanceDate: '2024-02-08T10:39:45.841Z',
      expirationDate: '2024-02-20T10:39:45.841Z',
      credentialSubject: [OutputVerifiableCredentialMapperFactory.for(gaiaXVerifiableCredential).map(gaiaXVerifiableCredential)],
      proof: expect.anything()
    })
    expect(result.proof.created).toEqual('2024-02-08T10:39:45.841Z')

    await gaiaXSignatureVerifier.verify(result)
  })
})
