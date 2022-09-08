import Joi from 'joi'
import { DID_WEB_PATTERN } from '../constants'

const proofSchema = {
  type: Joi.string().required(),
  created: Joi.date().required().iso(),
  proofPurpose: Joi.string().required(),
  jws: Joi.string().required(),
  verificationMethod: Joi.string().regex(DID_WEB_PATTERN).required()
}

// TODO: check W3C compliance (all required fields need to be included in schema)
const verifiableCredentialSchema = {
  '@context': Joi.array().required(),
  type: Joi.array().required(),
  id: Joi.string(),
  issuer: Joi.string().required(),
  issuanceDate: Joi.string().required(),
  credentialSubject: Joi.object().required(),
  proof: Joi.object(proofSchema).required()
}

/* EXPORTS */
export const ParticipantSelfDescriptionSchema = Joi.object(verifiableCredentialSchema).options({
  abortEarly: false
})

export const VerifySdSchema = Joi.object({
  url: Joi.string().uri().required()
}).options({
  abortEarly: false
})

export const SignedSelfDescriptionSchema = Joi.object({
  selfDescriptionCredential: Joi.object(verifiableCredentialSchema).required(),
  complianceCredential: Joi.object(verifiableCredentialSchema).required()
}).options({
  abortEarly: false
})
