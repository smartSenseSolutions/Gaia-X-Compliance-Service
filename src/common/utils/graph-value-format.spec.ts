import { graphValueFormat } from './graph-value-format'

describe('it should prepare fields for graph', function () {
  it('should remove did:web from uri', () => {
    expect(graphValueFormat('did:web:mydomain.com')).toEqual('mydomain.com')
  })
  it('should remove did:web from uri and replace semicolon with slash', () => {
    expect(graphValueFormat('did:web:mydomain.com:v1')).toEqual('mydomain.com/v1')
  })
  it('should remove did:web from uri and replace semicolons with slashes even', () => {
    expect(graphValueFormat('did:web:mydomain.com:v1:toto')).toEqual('mydomain.com/v1/toto')
  })
  it('should remove arrows', () => {
    expect(graphValueFormat('<did:web:mydomain.com:v1>')).toEqual('mydomain.com/v1')
  })
  it('should remove protocol from uri', () => {
    expect(graphValueFormat('https://mydomain.com/v1')).toEqual('mydomain.com/v1')
  })
})
