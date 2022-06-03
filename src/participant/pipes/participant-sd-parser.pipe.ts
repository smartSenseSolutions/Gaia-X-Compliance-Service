import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { hasExpectedValues } from '../../common/utils'
import { ParticipantSelfDescriptionDto, SignedParticipantSelfDescriptionDto } from '../dto/participant-sd.dto'
import { VerifyParticipantRawDto } from '../dto/verify-participant-raw.dto'
@Injectable()
export class ParticipantSDParserPipe implements PipeTransform<VerifyParticipantRawDto, SignedParticipantSelfDescriptionDto> {
  private readonly addressFields = ['legalAddress', 'headquarterAddress']

  private readonly expected = {
    '@context': {
      'gx-participant': 'http://w3id.org/gaia-x/participant#'
    },
    '@type': 'gx-participant:LegalPerson'
  }

  transform(participant: VerifyParticipantRawDto): SignedParticipantSelfDescriptionDto {
    try {
      const { proof, credentialSubject } = participant
      const selfDescription = {
        registrationNumber: undefined,
        legalAddress: undefined,
        headquarterAddress: undefined
      } as ParticipantSelfDescriptionDto

      if (!hasExpectedValues(participant.selfDescription, this.expected))
        throw new BadRequestException('Self Description is expected to be of type gx-participant:LegalPerson (http://w3id.org/gaia-x/participant#)')

      // transform self description into parsable JSON
      const keys = Object.keys(participant.selfDescription)
      keys.forEach(key => {
        const strippedKey = this.replacePlaceholderInKey(key)
        selfDescription[strippedKey] = this.getValueFromShacl(participant.selfDescription[key], strippedKey)
      })

      return {
        selfDescription,
        proof,
        credentialSubject,
        raw: JSON.stringify(participant.selfDescription)
      }
    } catch (error) {
      console.error(error)
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }

  private getValueFromShacl(shacl: any, key: string): any {
    if (this.addressFields.includes(key)) {
      const country = this.getValueFromShacl(shacl['gx-participant:country'], 'country')
      const state = this.getValueFromShacl(shacl['gx-participant:state'], 'state')

      return { country, state }
    }

    return shacl && typeof shacl === 'object' && '@value' in shacl ? shacl['@value'] : shacl
  }

  private replacePlaceholderInKey(key: string): string {
    return key.replace('gx-participant:', '')
  }
}
