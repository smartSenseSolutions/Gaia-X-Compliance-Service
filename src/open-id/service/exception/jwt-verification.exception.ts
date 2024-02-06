export class JwtVerificationException extends Error {
  constructor(didId: string) {
    super(`JWT cannot be verified with the given public keys for DID ${didId}`)
  }
}
