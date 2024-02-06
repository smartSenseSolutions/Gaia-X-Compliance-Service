export class InvalidNonceException extends Error {
  constructor(authSessionId: string) {
    super(`The VP token payload nonce doesn't match the auth session ${authSessionId} nonce`)
  }
}
