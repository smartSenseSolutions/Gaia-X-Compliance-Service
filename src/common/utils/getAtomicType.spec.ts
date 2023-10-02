import { getAtomicType } from './getAtomicType'
import { participantAndTsAndCsInVCInSeveralCS, participantInSingleCS, participantTypeInVCInSingleCS } from './getAtomicType.spec.util'

describe('getAtomicType should resolve VC or CS types', () => {
  it('should return LegalParticipant on a VC with a CS type LegalParticipant', () => {
    expect(getAtomicType(participantInSingleCS)).toEqual(['LegalParticipant'])
  })
  it('should return LegalParticipant on a VC of type with a CS', () => {
    expect(getAtomicType(participantTypeInVCInSingleCS)).toEqual(['LegalParticipant'])
  })
  it('should return LegalParticipant & TermsAndConditions on a VC with two CS', () => {
    expect(getAtomicType(participantAndTsAndCsInVCInSeveralCS)).toEqual(['LegalParticipant', 'GaiaXTermsAndConditions'])
  })
})
