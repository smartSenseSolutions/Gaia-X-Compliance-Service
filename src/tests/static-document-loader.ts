import fs from 'fs'
import jsonld from 'jsonld'

export default () => {
  const ctx1 = fs.readFileSync('src/tests/fixtures/credentials_v1_context.json', 'utf8')
  const ctx2 = fs.readFileSync('src/tests/fixtures/jws2020_v1_context.json', 'utf8')
  const ctx3 = fs.readFileSync('src/tests/fixtures/trustframework_context.json', 'utf8')
  const CONTEXTS = {
    'https://www.w3.org/2018/credentials/v1': ctx1,
    'https://w3id.org/security/suites/jws-2020/v1': ctx2,
    'https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#': ctx3
  }

  jsonld.documentLoader = (url, callback) => {
    if (url in CONTEXTS) {
      if (callback) {
        return callback(null, {
          contextUrl: null, // this is for a context via a link header
          document: CONTEXTS[url], // this is the actual document that was loaded
          documentUrl: url // this is the actual context URL after redirects
        })
      } else {
        return {
          contextUrl: null, // this is for a context via a link header
          document: CONTEXTS[url], // this is the actual document that was loaded
          documentUrl: url // this is the actual context URL after redirects
        }
      }
    } else {
      throw new Error('invalid context: ' + url)
    }
  }
}
