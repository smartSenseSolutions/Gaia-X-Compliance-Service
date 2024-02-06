import { Injectable } from '@nestjs/common'
import { StorageService } from '../../../../gaia-x-oidc4vc/service/storage.service'
import { ComplianceCredentialDto, VerifiableCredentialDto } from '../../common/dto'

@Injectable()
export class SignedCredentialStorageService extends StorageService<VerifiableCredentialDto<ComplianceCredentialDto>> {}
