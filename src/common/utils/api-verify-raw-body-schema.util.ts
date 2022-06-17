import { getSchemaPath } from '@nestjs/swagger'
import { ExamplesObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import { ParticipantSelfDescriptionDto, VerifiableSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto/service-offering-sd.dto'

type CredentialSubjectSchema = 'Participant' | 'ServiceOfferingExperimental'

function getSDCredentialSubjectSchema(credentialSubjectSchema: CredentialSubjectSchema) {
  return {
    type: 'array',
    items: { $ref: getSchemaPath(credentialSubjectSchema === 'Participant' ? ParticipantSelfDescriptionDto : ServiceOfferingSelfDescriptionDto) }
  }
}

export function getApiVerifyBodySchema(credentialSubjectSchema: CredentialSubjectSchema, examples: ExamplesObject) {
  const credSubSchema = getSDCredentialSubjectSchema(credentialSubjectSchema)
  return {
    schema: {
      allOf: [
        { $ref: getSchemaPath(VerifiableSelfDescriptionDto) },
        {
          properties: {
            selfDescriptionCredential: {
              properties: {
                credentialSubject: {
                  type: credSubSchema.type,
                  items:
                    credentialSubjectSchema === 'Participant'
                      ? {
                          allOf: [
                            credSubSchema.items,
                            {
                              properties: {
                                parentOrganisation: credSubSchema,
                                subOrganisation: credSubSchema
                              }
                            }
                          ]
                        }
                      : credSubSchema.items
                }
              }
            }
          }
        }
      ]
    },
    examples
  }
}
