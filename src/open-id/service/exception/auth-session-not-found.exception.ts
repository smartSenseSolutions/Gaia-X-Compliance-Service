export class AuthSessionNotFoundException extends Error {
  constructor(authSessionId: string) {
    super(`No auth session has ID ${authSessionId}`)
  }
}
