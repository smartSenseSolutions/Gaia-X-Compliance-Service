import { CommonModule } from '../common.module'
import { ConversionService } from './conversion.service'
import { Test, TestingModule } from '@nestjs/testing'
import * as jose from 'jose'

const payload = {
  id: 'did:example:123456789abcdefghi#key-1',
  name: 'John Doe',
  issuanceDate: '2020-01-01T00:00:00.000Z',
  expirationDate: '2099-01-01T00:00:00.000Z'
}

const expectedJwt =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpZDpleGFtcGxlOjEyMzQ1Njc4OWFiY2RlZmdoaSNrZXktMSIsIm5hbWUiOiJKb2huIERvZSIsImlzc3VhbmNlRGF0ZSI6IjIwMjAtMDEtMDFUMDA6MDA6MDAuMDAwWiIsImV4cGlyYXRpb25EYXRlIjoiMjA5OS0wMS0wMVQwMDowMDowMC4wMDBaIiwiaWF0IjoxNTc3ODM2ODAwLCJleHAiOjQwNzA5MDg4MDAsInN1YiI6ImRpZDpleGFtcGxlOjEyMzQ1Njc4OWFiY2RlZmdoaSNrZXktMSIsImlzcyI6ImRpZDp3ZWI6bG9jYWxob3N0JTNBMzAwMCIsImF1ZCI6ImRpZDpleGFtcGxlOjEyMzQ1Njc4OWFiY2RlZmdoaSNrZXktMSJ9.ICszQZ0eNODIEMCLlE_6kxBAnuMO5SakTvb1Mxc8XQl1XgCx4-uuEn3QGuJDJh2WI67KqRGajVOoD9-C-60cCYH7_9jms3x6UimeBWZcx3SIkbIFaeLxY2RToYsXThImnYhm0ZxhUohsX8SlBTq1u3GdyIdqFKR0CpysE_bIhpC-CXpd5thA8lCtLN2qGMEXhS8Uwfbm5vfBwrEKfSAm630QCpR8Q9YzV6KU2SA2ipOOxRGnTmS0EpoOQmzCZTDRcTPJsstM1lZ0Ki5c0zhMlop4SYw0Mrqt_OMcEUBEMq54qMfoQAWmDuEvcwTzZtr5GZwDAGMLCmeEUcHM5BvI8A'

describe('ConversionService', () => {
  let conversionService: ConversionService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule]
    }).compile()
    conversionService = moduleFixture.get<ConversionService>(ConversionService)
  })

  it('should be defined', () => {
    expect(conversionService).toBeDefined()
  })
  it('convert object to JSON', async () => {
    const result = await conversionService.convert('application/json', payload, {})
    expect(result.type).toBe('application/json')
    expect(result.value).toBe(JSON.stringify(payload, null, 2))
  })
  it('convert object to JWT', async () => {
    const result = await conversionService.convert('application/vc+jwt', payload, {})
    expect(result.type).toBe('application/vc+jwt')
    expect(result.value).toBe(expectedJwt)
  })
  it('JWT must be valid', async () => {
    const result = await jose.jwtVerify(expectedJwt, await jose.importSPKI(process.env.publicKey, 'ES256'))
    expect(result.payload).toBeDefined()
    expect(result.payload.sub).toBe(payload.id)
    expect(result.payload.aud).toBe(payload.id)
    expect(result.payload.iat).toBe(1577836800)
    expect(result.payload.exp).toBe(4070908800)
    expect(result.payload.iss).toBe('did:web:localhost%3A3000')
  })
})
