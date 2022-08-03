import Joi from 'joi'
import { DID_WEB_PATTERN } from '../constants'

export const proofSchema = {
  type: Joi.string().required(),
  created: Joi.date().required().iso(),
  proofPurpose: Joi.string().required(),
  jws: Joi.string().required(),
  verificationMethod: Joi.string().regex(DID_WEB_PATTERN).required()
}

export const complianceCredentialSchema = {
  '@context': Joi.array().required(),
  '@type': Joi.array().required(),
  id: Joi.string().required(),
  issuer: Joi.string().required(),
  issuanceDate: Joi.string().required(),
  credentialSubject: Joi.object().required(),
  proof: Joi.object(proofSchema).required()
}

export const selfDescriptionSchema = {
  '@context': Joi.array().required(),
  '@id': Joi.string().required(),
  '@type': Joi.array().required(),
  credentialSubject: Joi.object().required(),
  proof: Joi.object(proofSchema).required()
}

export const ParticipantSelfDescriptionSchema = Joi.object(selfDescriptionSchema).options({
  abortEarly: false
})

/* SCHEMAS */
export const VerifySdSchema = Joi.object({
  url: Joi.string().uri().required()
}).options({
  abortEarly: false
})

export const SignedSelfDescriptionSchema = Joi.object({
  selfDescriptionCredential: Joi.object(selfDescriptionSchema).required(),
  complianceCredential: Joi.object(complianceCredentialSchema).required()
}).options({
  abortEarly: false
})
