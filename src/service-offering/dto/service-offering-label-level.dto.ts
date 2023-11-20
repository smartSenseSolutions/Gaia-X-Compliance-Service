import { LabelLevelCriteriaEnum } from '../enum/label-level-criteria.enum'

export class ServiceOfferingLabelLevelDto {
  /**
   * The ServiceOffering resolvable link surrounded by '<' and '>.
   * @private
   */
  private readonly _serviceOfferingId: string
  /**
   * The ServiceOfferingCriteria containing the confirmation status of each criterion
   * @private
   */
  private readonly _criteria: Map<LabelLevelCriteriaEnum, string>

  constructor(serviceOfferingId: string, criteria: Map<LabelLevelCriteriaEnum, string>) {
    this._serviceOfferingId = serviceOfferingId
    this._criteria = criteria
  }

  get serviceOfferingId(): string {
    return this._serviceOfferingId
  }

  get criteria(): Map<LabelLevelCriteriaEnum, string> {
    return this._criteria
  }
}
