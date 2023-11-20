import { Injectable } from '@nestjs/common'
import { ValidationResult } from '../../common/dto'
import { VcQueryService } from '../../common/services/vc-query.service'
import { LabelLevelCriteriaEnum } from '../enum/label-level-criteria.enum'

@Injectable()
export class ServiceOfferingLabelLevelValidationService {
  private readonly LABEL_1_REQUIREMENTS: LabelLevelCriteriaEnum[] = [
    LabelLevelCriteriaEnum.P1_1_1,
    LabelLevelCriteriaEnum.P1_1_2,
    LabelLevelCriteriaEnum.P1_1_3,
    LabelLevelCriteriaEnum.P1_1_4,
    LabelLevelCriteriaEnum.P1_2_1,
    LabelLevelCriteriaEnum.P1_2_2,
    LabelLevelCriteriaEnum.P1_2_3,
    LabelLevelCriteriaEnum.P1_2_4,
    LabelLevelCriteriaEnum.P1_2_5,
    LabelLevelCriteriaEnum.P1_2_6,
    LabelLevelCriteriaEnum.P1_2_7,
    LabelLevelCriteriaEnum.P1_2_8,
    LabelLevelCriteriaEnum.P1_2_9,
    LabelLevelCriteriaEnum.P1_2_10,
    LabelLevelCriteriaEnum.P1_3_1,
    LabelLevelCriteriaEnum.P1_3_2,
    LabelLevelCriteriaEnum.P1_3_3,
    LabelLevelCriteriaEnum.P1_3_4,
    LabelLevelCriteriaEnum.P1_3_5,
    LabelLevelCriteriaEnum.P2_1_1,
    LabelLevelCriteriaEnum.P2_1_2,
    LabelLevelCriteriaEnum.P2_1_3,
    LabelLevelCriteriaEnum.P2_2_1,
    LabelLevelCriteriaEnum.P2_2_2,
    LabelLevelCriteriaEnum.P2_2_3,
    LabelLevelCriteriaEnum.P2_2_4,
    LabelLevelCriteriaEnum.P2_2_5,
    LabelLevelCriteriaEnum.P2_2_6,
    LabelLevelCriteriaEnum.P2_2_7,
    LabelLevelCriteriaEnum.P2_3_1,
    LabelLevelCriteriaEnum.P2_3_2,
    LabelLevelCriteriaEnum.P2_3_3,
    LabelLevelCriteriaEnum.P3_1_1,
    LabelLevelCriteriaEnum.P3_1_2,
    LabelLevelCriteriaEnum.P3_1_3,
    LabelLevelCriteriaEnum.P3_1_4,
    LabelLevelCriteriaEnum.P3_1_5,
    LabelLevelCriteriaEnum.P3_1_6,
    LabelLevelCriteriaEnum.P3_1_7,
    LabelLevelCriteriaEnum.P3_1_8,
    LabelLevelCriteriaEnum.P3_1_9,
    LabelLevelCriteriaEnum.P3_1_10,
    LabelLevelCriteriaEnum.P3_1_11,
    LabelLevelCriteriaEnum.P3_1_12,
    LabelLevelCriteriaEnum.P3_1_13,
    LabelLevelCriteriaEnum.P3_1_14,
    LabelLevelCriteriaEnum.P3_1_15,
    LabelLevelCriteriaEnum.P3_1_16,
    LabelLevelCriteriaEnum.P3_1_17,
    LabelLevelCriteriaEnum.P3_1_18,
    LabelLevelCriteriaEnum.P3_1_19,
    LabelLevelCriteriaEnum.P3_1_20,
    LabelLevelCriteriaEnum.P4_1_1,
    LabelLevelCriteriaEnum.P4_1_2,
    LabelLevelCriteriaEnum.P5_2_1
  ]

  constructor(private readonly vcQueryService: VcQueryService) {}

  async validate(VPUUID: string): Promise<ValidationResult> {
    const labelLevels = await this.vcQueryService.collectServiceOfferingLabelLevelDtos(VPUUID)

    const denied = new Map<string, LabelLevelCriteriaEnum[]>()
    for (const labelLevel of labelLevels) {
      denied.set(labelLevel.serviceOfferingId, [])
      for (const requirement of this.LABEL_1_REQUIREMENTS) {
        if (labelLevel.criteria.get(requirement) !== 'Confirm') {
          denied.get(labelLevel.serviceOfferingId).push(requirement)
        }
      }
    }

    const result = {
      conforms: true,
      results: []
    }

    for (const entry of denied.entries()) {
      if (entry[1].length > 0) {
        result.conforms = false
        result.results.push(
          `The following criteria weren't confirmed for service offering ${entry[0]}: ${entry[1]
            .sort((a, b) => a - b)
            .map(label => LabelLevelCriteriaEnum[label])
            .join(', ')}`
        )
      }
    }

    return result
  }
}
