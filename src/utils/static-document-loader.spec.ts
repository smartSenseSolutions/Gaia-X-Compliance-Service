import staticDocumentLoader from './static-document-loader'
import jsonld from 'jsonld'

describe('static-document-loader', () => {
  const jsonldLoader = jsonld.documentLoader
  it('should return local context for jws', async () => {
    staticDocumentLoader(null)
    const vcCtxt = await jsonld.documentLoader('https://www.w3.org/2018/credentials/v1')
    expect(vcCtxt).toBeDefined()
    expect(vcCtxt.document).toBeDefined()
    expect(vcCtxt.document).toContain('VerifiableCredential')
  })
  it('should return try to fetch from original loader with an unknown context', async () => {
    const loader = (url, _callback) => {
      return url
    }
    staticDocumentLoader(loader)
    const vcCtxt = await jsonld.documentLoader('https://w3id.org/security#')
    expect(vcCtxt).toBeDefined()
    expect(vcCtxt).toContain('https://w3id.org/security#')
  })
  it('should return try to fetch from internet with an unknown context', async () => {
    staticDocumentLoader(jsonldLoader)
    try {
      await jsonld.documentLoader('https://w3id.org/security#')
      fail('original loader was not properly called')
    } catch (e) {
      expect(e).toBeDefined()
    }
  })
})
