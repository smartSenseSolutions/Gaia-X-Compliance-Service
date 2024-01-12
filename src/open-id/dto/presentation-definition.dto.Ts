import { EncryptionAlgorithmEnum } from '../../common/enum/encryption-algorithm.enum'

export interface PresentationDefinitionDto {
  id: string
  format: FormatDto
  input_descriptors: InputDescriptorDto[]
}

export interface InputDescriptorDto {
  id: string
  constraints: {
    fields: FieldDto[]
  }
  format: FormatDto
}

export interface FieldDto {
  filter: {
    pattern?: string
    const?: string
    contains?: {
      const: string
    }
    type: string
  }
  path: string[]
}

export interface FormatDto {
  jwt_vc: {
    alg: EncryptionAlgorithmEnum[]
  }
  jwt_vp: {
    alg: EncryptionAlgorithmEnum[]
  }
}
