import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { HttpService } from '@nestjs/axios'
import { JoiValidationPipe } from '../pipes'
import { ParticipantSelfDescriptionSchema } from '../schema/selfDescription.schema'
import { webResolver } from '../utils'
import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { SelfDescriptionTypes } from '../enums'
import { ServiceOfferingSelfDescriptionDto } from 'src/service-offering/dto'

interface QueryResult {
  status: boolean
  leaf?: VPNode<any>
}

interface ConformityCheck {
  status: boolean
  res: any
}

class VPNode<VerifiableCredentialDto> {
  leaf: VerifiableCredentialDto
  type: string
  provider?: string
  constructor(type: string, leaf: VerifiableCredentialDto, provider = '') {
    this.type = type
    this.leaf = leaf
    this.provider = provider
  }

}

class VPGraph<T> {
  nodes: Map<string, VPNode<T>[]>
  constructor() {
    this.nodes = new Map([])
  }

  checkTypeExistance(type: string, id: string) {
    const leaves = this.nodes.get(id)
    for (let i = 0; i < leaves.length; i++) {
      if (leaves[i].type == type) {
        return true
      }
    }
    return false
  }

  checkProvidedByNode(provider: string): QueryResult {
    for (const [key, value] of this.nodes.entries()) {
      const node = this.nodes.get(key)
      for (let i = 0; i < node.length; i++) {
        if (node[i].provider == provider) {
          return {
            status: true,
            leaf: node[i]
          }
        }
      }
    }
    return { status: false }
  }

  checkParticipantGraph() {
    const vcs = []
    const missingTypes = []
    for (const [key, value] of this.nodes.entries()) {
      let type = ['LegalPerson', 'RegistrationNumber', 'TermsAndCondition']
      const node = this.nodes.get(key)
      const vc = []
      for (let i = 0; i < node.length; i++) {
        vc.push(node[i].leaf)
        type = type.filter(item => item !== node[i].type)
      }
      if (vc.length == 3) {
        vcs.push(vc)
      } else {
        missingTypes.push(type)
      }
    }
    return this.checkConformity(vcs, missingTypes)
  }

  checkSOGraph(): ConformityCheck {
    const vcs = []
    const missingTypes = []
    for (const [key, value] of this.nodes.entries()) {
      let type = ['ServiceOfferingExperimental', 'ParticipantCredential']
      const node = this.nodes.get(key)
      const vc = []
      for (let i = 0; i < node.length; i++) {
        vc.push(node[i].leaf)
        type = type.filter(item => item !== node[i].type)
      }
      if (vc.length == 2) {
        vcs.push(vc)
      } else {
        missingTypes.push(type)
      }
    }
    return this.checkConformity(vcs, missingTypes)
  }

  checkConformity(vcs, missing_types): ConformityCheck {
    if (vcs.length == 0) {
      return {
        status: false,
        res: 'Missing VC of type: ' + missing_types.join(',')
      }
    }
    if (vcs.length == 1) {
      return {
        status: true,
        res: vcs[0]
      }
    }
    if (vcs.length > 1) {
      return {
        status: false,
        res: 'More than one valid VC payload were found within VP'
      }
    }
  }
}

@Injectable()
export class VpParserService {
  constructor(private readonly httpService: HttpService) {}

  private readonly logger = new Logger(VpParserService.name)
  public async parseVP(VCs: VerifiableCredentialDto<CredentialSubjectDto>[]) {
    const vpType = this.GetTypes(VCs)
    const vp_graph: VPGraph<VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto | CredentialSubjectDto>> = new VPGraph()
    for (let i = 0; i < VCs.length; i++) {
      try {
        const vc = await this.parseVC(VCs[i])
        const type = vc.type.find(t => t !== 'VerifiableCredential')
        if (Object.values(SelfDescriptionTypes).includes(type as SelfDescriptionTypes)) {
          TreeFns[type](vc, vp_graph)
        }
        if (!vc.credentialSubject.id) {
          throw new ConflictException('Missing credential id for VC of type ' + type)
        }
      } catch (e) {
        this.logger.error(e)
        throw e
      }
    }
    if (vpType == 'LegalPerson') {
      const ParticipantVCS = vp_graph.checkParticipantGraph()
      if (ParticipantVCS.status == true) {
        return ParticipantVCS.res
      } else {
        throw new ConflictException(ParticipantVCS.res + ` for ${vpType} compliance credential issuance`)
      }
    }
    if (vpType == 'ServiceOfferingExperimental') {
      const serviceOfferingVCS = vp_graph.checkSOGraph()
      if (serviceOfferingVCS.status == true) {
        return serviceOfferingVCS.res
      } else {
        throw new ConflictException(serviceOfferingVCS.res + ` for ${vpType} compliance credential issuance`)
      }
    }
  }

  private async parseVC(VC: VerifiableCredentialDto<CredentialSubjectDto>): Promise<VerifiableCredentialDto<CredentialSubjectDto>> {
    const pipe = new JoiValidationPipe(ParticipantSelfDescriptionSchema)
    if (VC.credentialSubject) {
      return VC
    } else {
      try {
        if (VC.id.startsWith('https')) {
          return pipe.transform(await this.httpService.get(VC.id).toPromise())
        } else {
          return pipe.transform((await this.httpService.get(webResolver(VC.id)).toPromise()).data)
        }
      } catch (error) {
        console.error(error)
        throw new ConflictException('Unable to parse VC')
      }
    }
  }

  private GetTypes(vcs: VerifiableCredentialDto<CredentialSubjectDto>[]) {
    for (let i = 0; i < vcs.length; i++) {
      const type = vcs[i].type.find(t => t !== 'VerifiableCredential')
      if (type == 'LegalPerson' || type == 'ServiceOfferingExperimental') {
        return type
      }
    }
    throw new ConflictException('Invalid Payload, missing Participant VC or Service-Offering VC')
  }
}

const TreeFns: {
  [key: string]: (
    vc: VerifiableCredentialDto<CredentialSubjectDto | ServiceOfferingSelfDescriptionDto>,
    VPGraph: VPGraph<VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto | CredentialSubjectDto>>
  ) => void
} = {
  [SelfDescriptionTypes.PARTICIPANT]: async (vc: VerifiableCredentialDto<CredentialSubjectDto>, VPGraph) => {
    if (!VPGraph.nodes.has(vc.credentialSubject.id)) {
      VPGraph.nodes.set(vc.credentialSubject.id, [])
      VPGraph.nodes.get(vc.credentialSubject.id).push(new VPNode('LegalPerson', vc))
    } else {
      if (!VPGraph.checkTypeExistance('LegalPerson', vc.id)) {
        VPGraph.nodes.get(vc.credentialSubject.id).push(new VPNode('LegalPerson', vc))
      }
    }
  },
  [SelfDescriptionTypes.SERVICE_OFFERING]: async (vc: VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto>, VPGraph) => {
    if (!VPGraph.nodes.has(vc.credentialSubject.id)) {
      if (VPGraph.nodes.has(vc.credentialSubject['gx-service-offering:providedBy'])) {
        VPGraph.nodes
          .get(vc.credentialSubject['gx-service-offering:providedBy'])
          .push(new VPNode('ServiceOfferingExperimental', vc, vc.credentialSubject['gx-service-offering:providedBy']))
        VPGraph.nodes.set(vc.credentialSubject.id, VPGraph.nodes.get(vc.credentialSubject['gx-service-offering:providedBy']))
        VPGraph.nodes.delete(vc.credentialSubject['gx-service-offering:providedBy'])
      } else {
        VPGraph.nodes.set(vc.credentialSubject.id, [])
        VPGraph.nodes
          .get(vc.credentialSubject.id)
          .push(new VPNode('ServiceOfferingExperimental', vc, vc.credentialSubject['gx-service-offering:providedBy']))
      }
    } else {
      if (!VPGraph.checkTypeExistance('ServiceOfferingExperimental', vc.credentialSubject.id)) {
        VPGraph.nodes[vc.credentialSubject.id].push(new VPNode('ServiceOfferingExperimental', vc, vc.credentialSubject.providedBy))
      }
    }
  },
  [SelfDescriptionTypes.PARTICIPANT_CREDENTIAL]: async (vc, VPGraph) => {
    const providedBy = VPGraph.checkProvidedByNode(vc.credentialSubject.id)
    if (!providedBy.status) {
      VPGraph.nodes.set(vc.credentialSubject.id, [])
      VPGraph.nodes.get(vc.credentialSubject.id).push(new VPNode('ParticipantCredential', vc, vc.credentialSubject['gx-service-offering:providedBy']))
    } else {
      const id = providedBy.leaf.leaf.credentialSubject.id
      if (!VPGraph.checkTypeExistance('ParticipantCredential', id)) {
        VPGraph.nodes.get(id).push(new VPNode('ParticipantCredential', vc))
      }
    }
  },
  [SelfDescriptionTypes.TERMS_AND_CONDITION]: async (vc: VerifiableCredentialDto<CredentialSubjectDto>, VPGraph) => {
    if (!VPGraph.nodes.has(vc.credentialSubject.id)) {
      VPGraph.nodes.set(vc.credentialSubject.id, [])
      VPGraph.nodes.get(vc.credentialSubject.id).push(new VPNode('TermsAndCondition', vc))
    } else {
      if (!VPGraph.checkTypeExistance('TermsAndCondition', vc.credentialSubject.id)) {
        VPGraph.nodes.get(vc.credentialSubject.id).push(new VPNode('TermsAndCondition', vc))
      }
    }
  },
  [SelfDescriptionTypes.REGISTRATION_NUMBER]: async (vc: VerifiableCredentialDto<CredentialSubjectDto>, VPGraph) => {
    if (!VPGraph.nodes.has(vc.credentialSubject.id)) {
      VPGraph.nodes.set(vc.credentialSubject.id, [])
      VPGraph.nodes.get(vc.credentialSubject.id).push(new VPNode('RegistrationNumber', vc))
    } else {
      if (!VPGraph.checkTypeExistance('RegistrationNumber', vc.credentialSubject.id)) {
        VPGraph.nodes.get(vc.credentialSubject.id).push(new VPNode('RegistrationNumber', vc))
      }
    }
  }
}
