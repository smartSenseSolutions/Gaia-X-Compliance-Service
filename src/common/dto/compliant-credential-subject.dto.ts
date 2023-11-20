/**
 * DTO class representing a compliance response credential subject signed by Gaia-X
 */
export class CompliantCredentialSubjectDto {
  type: string
  id: string
  'gx:integrity': string
  'gx:integrityNormalization': string
  'gx:version': string
  'gx:type': string | string[]
}
