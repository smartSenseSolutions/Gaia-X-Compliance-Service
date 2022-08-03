import { ValidationResultDto } from '../dto'

export type ValidationResulWithoutContent = Omit<ValidationResultDto, 'content'>
