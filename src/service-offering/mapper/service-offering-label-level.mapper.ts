import { ServiceOfferingLabelLevelDto } from '../dto/service-offering-label-level.dto'
import { LabelLevelCriteriaEnum } from '../enum/label-level-criteria.enum'

export class ServiceOfferingLabelLevelMapper {
  static readonly criterionTypePrefix = '_https_registry_lab_gaia_x_eu_development_api_trusted_shape_registry_v1_shapes_jsonld_trustframework_'

  /**
   * Maps a Memgraph query result to a {@link ServiceOfferingLabelLevelDto}
   * @param queryResult
   */
  static map(queryResult: any): ServiceOfferingLabelLevelDto {
    const criteriaMap = new Map<LabelLevelCriteriaEnum, string>()
    const criteria = queryResult.criteria
    for (const [criterion, conformity] of criteria) {
      const labelLevel = this.mapLabelLevel(criterion)

      if (labelLevel !== null) {
        criteriaMap.set(labelLevel, conformity)
      }
    }

    return new ServiceOfferingLabelLevelDto(queryResult.serviceOfferingId, criteriaMap)
  }

  private static mapLabelLevel(criterionType: string): LabelLevelCriteriaEnum {
    const labelLevel = LabelLevelCriteriaEnum[criterionType.slice(this.criterionTypePrefix.length, -1)]
    if (labelLevel !== undefined) {
      return labelLevel
    }

    return null
  }
}
