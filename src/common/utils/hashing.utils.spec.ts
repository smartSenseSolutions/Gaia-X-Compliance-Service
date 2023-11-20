import { HashingUtils } from './hashing.utils'

describe('HashingUtils', () => {
  it('should return a SHA256 hashed string', () => {
    expect(HashingUtils.sha256('Gaia-X')).toEqual('a6d042c4b01535820766cce35acb8fda2625c41fe587e87919c1552f23533d28')
  })

  it('should return a null SHA256 hashed string', () => {
    expect(HashingUtils.sha256(null)).toBeNull()
  })

  it('should return a SHA512 hashed string', () => {
    expect(HashingUtils.sha512('Gaia-X')).toEqual(
      'ac7da87bd2e7270447a7d371304ff658f13955d1f43f70768236283dea884d84c6bdb5a7ca606763939faf54caf1b50f28c15dbb9660e4c677dd786c657ce5a0'
    )
  })

  it('should return a null SHA512 hashed string', () => {
    expect(HashingUtils.sha512(null)).toBeNull()
  })
})
