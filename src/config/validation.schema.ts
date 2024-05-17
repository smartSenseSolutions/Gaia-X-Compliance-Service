import Joi from 'joi'

export default Joi.object({
  PORT: Joi.alternatives().try(Joi.string(), Joi.number()).default(3000),
  REGISTRY_URL: Joi.string().required(),
  privateKey: Joi.string().required(),
  X509_CERTIFICATE: Joi.string().optional()
})
