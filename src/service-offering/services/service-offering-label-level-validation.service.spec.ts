import { Test, TestingModule } from '@nestjs/testing'
import { CommonModule } from '../../common/common.module'
import { VcQueryService } from '../../common/services/vc-query.service'
import { ServiceOfferingLabelLevelDto } from '../dto/service-offering-label-level.dto'
import { LabelLevelCriteriaEnum } from '../enum/label-level-criteria.enum'
import { ServiceOfferingLabelLevelValidationService } from './service-offering-label-level-validation.service'

describe('ServiceOfferingLabelLevelValidationService', () => {
  const VPUUID = 'f31a0a40-62e5-4170-b391-c000dcb2192a'
  const validDto = new ServiceOfferingLabelLevelDto(
    '<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8D5ch6kzdcppz5v33FsigeezVhPyjpwXbkjEbSxGua7dK42e4ohoWNZmCGfk9JFJhdDy3AT4PzVw32tkKQwKkbUDm2qnK7T88S3qQPqXG73Shi48jtJvH7kX7J3zTKjAKgPAae5Q4vRRaPKFwSKu2gzJU8xja5RkYxNRmyXEpfT5K458AnoGMccM5WjQHCWv9zaha1wPbSwPgjdWKBVghFbeZM3mkQ66yi35vahn2D8kV12Njbu1BnxTwsUn8P8Fqrvybx3s1rG7fi53RNiRC2qQ86gR8urG8qjK8jAXpQWMWmvhsrRqdZ2B4pusnopuAPNbtaQZTx3LmKurE1RwnAMeyUsxYAfH6PLVoYSwm8UTcN456JEbjzM7J2uquXzeEbWTdNm94YHoPMBrZZ41wuN2QQcw6rfCL2fsXhpX3Y9qVicr2SdioHRELm1zqjjL5AA2ZJcyWk9hhiXyMiGzZwhE4UyCji7m4QaYP7TgjgxfNR2S6tb1BXrEaehUttNwUXzKfqN#f99c57cc72d83c212177561ba6a21fc505697c61d6a8d9a83c6aebd422c7df82>',
    new Map<LabelLevelCriteriaEnum, string>([
      [LabelLevelCriteriaEnum.P1_1_1, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_1_2, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_1_3, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_1_4, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_2_1, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_2_2, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_2_3, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_2_4, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_2_5, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_2_6, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_2_7, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_2_8, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_2_9, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_2_10, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_3_1, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_3_2, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_3_3, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_3_4, 'Confirm'],
      [LabelLevelCriteriaEnum.P1_3_5, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_1_1, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_1_2, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_1_3, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_2_1, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_2_2, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_2_3, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_2_4, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_2_5, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_2_6, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_2_7, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_3_1, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_3_2, 'Confirm'],
      [LabelLevelCriteriaEnum.P2_3_3, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_1, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_2, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_3, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_4, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_5, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_6, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_7, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_8, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_9, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_10, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_11, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_12, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_13, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_14, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_15, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_16, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_17, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_18, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_19, 'Confirm'],
      [LabelLevelCriteriaEnum.P3_1_20, 'Confirm'],
      [LabelLevelCriteriaEnum.P4_1_1, 'Confirm'],
      [LabelLevelCriteriaEnum.P4_1_2, 'Confirm'],
      [LabelLevelCriteriaEnum.P5_1_1, 'Not applicable'],
      [LabelLevelCriteriaEnum.P5_1_2, 'Not applicable'],
      [LabelLevelCriteriaEnum.P5_1_3, 'Not applicable'],
      [LabelLevelCriteriaEnum.P5_1_4, 'Not applicable'],
      [LabelLevelCriteriaEnum.P5_1_5, 'Not applicable'],
      [LabelLevelCriteriaEnum.P5_1_6, 'Not applicable'],
      [LabelLevelCriteriaEnum.P5_1_7, 'Not applicable'],
      [LabelLevelCriteriaEnum.P5_2_1, 'Confirm']
    ])
  )

  let vcQueryService: VcQueryService
  let serviceOfferingLabelLevelValidationService: ServiceOfferingLabelLevelValidationService

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CommonModule]
    }).compile()

    vcQueryService = moduleRef.get<VcQueryService>(VcQueryService)
    serviceOfferingLabelLevelValidationService = moduleRef.get<ServiceOfferingLabelLevelValidationService>(ServiceOfferingLabelLevelValidationService)
  })

  describe('validation', () => {
    it('should return conformity with no errors if label level 1 is missing', async () => {
      jest.spyOn(vcQueryService, 'collectServiceOfferingLabelLevelDtos').mockImplementation(() => new Promise(resolve => resolve([])))

      const result = await serviceOfferingLabelLevelValidationService.validate(VPUUID)

      expect(result.conforms).toBe(true)
      expect(result.results).toStrictEqual([])
    })
    it('should return conformity with no errors', async () => {
      const anotherValidDto = new ServiceOfferingLabelLevelDto(validDto.serviceOfferingId, new Map(validDto.criteria))
      jest
        .spyOn(vcQueryService, 'collectServiceOfferingLabelLevelDtos')
        .mockImplementation(() => new Promise(resolve => resolve([validDto, anotherValidDto])))

      const result = await serviceOfferingLabelLevelValidationService.validate(VPUUID)

      expect(result.conforms).toBe(true)
      expect(result.results).toStrictEqual([])
    })
    it('should return conformity errors', async () => {
      const invalidDto = new ServiceOfferingLabelLevelDto(validDto.serviceOfferingId, new Map(validDto.criteria))
      invalidDto.criteria.set(LabelLevelCriteriaEnum.P1_2_2, 'Deny')
      invalidDto.criteria.set(LabelLevelCriteriaEnum.P2_1_3, 'Deny')
      invalidDto.criteria.set(LabelLevelCriteriaEnum.P3_1_7, 'Not applicable')
      const anotherInvalidDto = new ServiceOfferingLabelLevelDto(
        '<https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8D5ch6kzdcppz5v33FsigeezVhPyjpwXbkjEbSxGua7dK42e4ohoWNZmCGfk9JFJhdDy3AT4PzVw32tkKQwKkbUDm2qnK7T88S3qQPqXG73Shi48jtJvH7kX7J3zTKjAKgPAae5Q4vRRaPKFwSKu2gzJU8xja5RkYxNRmyXEpfT5K458AnoGMccM5WjQHCWv9zaha1wPbSwPgjdWKBVghFbeZM3mkQ66yi35vahn2D8kV12Njbu1BnxTwsUn8P8Fqrvybx3s1rG7fi53RNiRC2qQ86gR8urG8qjK8jAXpQWMWmvhsrRqdZ2B4pusnopuAPNbtaQZTx3LmKurE1RwnAMeyUsxYAfH6PLVoYSwm8UTcN456JEbjzM7J2uquXzeEbWTdNm94YHoPMBrZZ41wuN2QQcw6rfCL2fsXhpX3Y9qVicr2SdioHRELm1zqjjL5AA2ZJcyWk9hhiXyMiGzZwhE4UyCji7m4QaYP7TgjgxfNR2S6tb1BXrEaehUttNwUXzKfqN#f99c57cc72d83c212177561ba6a21fc505697c61d6a8d9a83c6aebd422c7df83>',
        new Map(validDto.criteria)
      )
      anotherInvalidDto.criteria.set(LabelLevelCriteriaEnum.P1_2_1, 'Deny')
      anotherInvalidDto.criteria.set(LabelLevelCriteriaEnum.P4_1_1, 'Deny')
      anotherInvalidDto.criteria.set(LabelLevelCriteriaEnum.P3_1_14, 'Not applicable')

      jest
        .spyOn(vcQueryService, 'collectServiceOfferingLabelLevelDtos')
        .mockImplementation(() => new Promise(resolve => resolve([invalidDto, anotherInvalidDto])))

      const result = await serviceOfferingLabelLevelValidationService.validate(VPUUID)

      expect(result.conforms).toBe(false)
      expect(result.results).toStrictEqual([
        `The following criteria weren't confirmed for service offering <https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8D5ch6kzdcppz5v33FsigeezVhPyjpwXbkjEbSxGua7dK42e4ohoWNZmCGfk9JFJhdDy3AT4PzVw32tkKQwKkbUDm2qnK7T88S3qQPqXG73Shi48jtJvH7kX7J3zTKjAKgPAae5Q4vRRaPKFwSKu2gzJU8xja5RkYxNRmyXEpfT5K458AnoGMccM5WjQHCWv9zaha1wPbSwPgjdWKBVghFbeZM3mkQ66yi35vahn2D8kV12Njbu1BnxTwsUn8P8Fqrvybx3s1rG7fi53RNiRC2qQ86gR8urG8qjK8jAXpQWMWmvhsrRqdZ2B4pusnopuAPNbtaQZTx3LmKurE1RwnAMeyUsxYAfH6PLVoYSwm8UTcN456JEbjzM7J2uquXzeEbWTdNm94YHoPMBrZZ41wuN2QQcw6rfCL2fsXhpX3Y9qVicr2SdioHRELm1zqjjL5AA2ZJcyWk9hhiXyMiGzZwhE4UyCji7m4QaYP7TgjgxfNR2S6tb1BXrEaehUttNwUXzKfqN#f99c57cc72d83c212177561ba6a21fc505697c61d6a8d9a83c6aebd422c7df82>: P1_2_2, P2_1_3, P3_1_7`,
        `The following criteria weren't confirmed for service offering <https://wizard.lab.gaia-x.eu/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8D5ch6kzdcppz5v33FsigeezVhPyjpwXbkjEbSxGua7dK42e4ohoWNZmCGfk9JFJhdDy3AT4PzVw32tkKQwKkbUDm2qnK7T88S3qQPqXG73Shi48jtJvH7kX7J3zTKjAKgPAae5Q4vRRaPKFwSKu2gzJU8xja5RkYxNRmyXEpfT5K458AnoGMccM5WjQHCWv9zaha1wPbSwPgjdWKBVghFbeZM3mkQ66yi35vahn2D8kV12Njbu1BnxTwsUn8P8Fqrvybx3s1rG7fi53RNiRC2qQ86gR8urG8qjK8jAXpQWMWmvhsrRqdZ2B4pusnopuAPNbtaQZTx3LmKurE1RwnAMeyUsxYAfH6PLVoYSwm8UTcN456JEbjzM7J2uquXzeEbWTdNm94YHoPMBrZZ41wuN2QQcw6rfCL2fsXhpX3Y9qVicr2SdioHRELm1zqjjL5AA2ZJcyWk9hhiXyMiGzZwhE4UyCji7m4QaYP7TgjgxfNR2S6tb1BXrEaehUttNwUXzKfqN#f99c57cc72d83c212177561ba6a21fc505697c61d6a8d9a83c6aebd422c7df83>: P1_2_1, P3_1_14, P4_1_1`
      ])
    })
  })
})
