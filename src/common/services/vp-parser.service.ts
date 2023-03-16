import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { HttpService } from '@nestjs/axios'
import { JoiValidationPipe } from '../pipes'
import { ParticipantSelfDescriptionSchema } from '../schema/selfDescription.schema'
import { webResolver } from '../utils'
import { ConflictException, Injectable } from '@nestjs/common'
import { SelfDescriptionTypes } from '../enums'
import { ServiceOfferingSelfDescriptionDto } from 'src/service-offering/dto'

interface Query_result {
  status: boolean
  response?: any
}

interface Conformity_check {
  status: boolean
  res: any
}

class VP_Node<VerifiableCredentialDto> {
  leaf: VerifiableCredentialDto
  type: string
  provider?: string
  constructor(type: string, leaf: VerifiableCredentialDto, provider = '') {
    this.type = type
    this.leaf = leaf
    this.provider = provider
  }

  addleaf(root: VP_Node<VerifiableCredentialDto>) {
    return true
  }
}

class VP_graph<T> {
  nodes: Map<string, VP_Node<T>[]>
  constructor() {
    this.nodes = new Map([])
  }

  CheckTypeExistance(type: string, id: string) {
    const leaves = this.nodes.get(id)
    for (let i = 0; i < leaves.length; i++) {
      if (leaves[i].type == type) {
        return true
      }
    }
    return false
  }

  CheckProvidedByNode(provider: string): Query_result {
    for (const [key, value] of this.nodes.entries()) {
      const node = this.nodes.get(key)
      for (let i = 0; i < node.length; i++) {
        if (node[i].provider == provider) {
          return {
            status: true,
            response: node[i]
          }
        }
      }
    }
    return { status: false }
  }

  CheckParticipantGraph() {
    const vcs = []
    const missing_types = []
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
        missing_types.push(type)
      }
    }
    return this.ConformityCheck(vcs, missing_types)
  }

  CheckSOGraph(): Conformity_check {
    const vcs = []
    const missing_types = []
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
        missing_types.push(type)
      }
    }
    return this.ConformityCheck(vcs, missing_types)
  }

  ConformityCheck(vcs, missing_types): Conformity_check {
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

  public async parseVP(VCs: VerifiableCredentialDto<CredentialSubjectDto>[]) {
    const VP_type = this.GetType(VCs)
    const vp_graph: VP_graph<VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto | CredentialSubjectDto>> = new VP_graph()
    for (let i = 0; i < VCs.length; i++) {
      try {
        const vc = await this.parseVC(VCs[i])
        const type = vc.type.find(t => t !== 'VerifiableCredential')
        if (!vc.credentialSubject.id) {
          throw new ConflictException('Missing credential id for VC of type ' + type)
        }
        if (Object.values(SelfDescriptionTypes).includes(type as SelfDescriptionTypes)) {
          TreeFns[type](vc, vp_graph)
        }
      } catch (e) {
        throw e
      }
    }
    if (VP_type == 'LegalPerson') {
      const Participant_vcs = vp_graph.CheckParticipantGraph()
      if (Participant_vcs.status == true) {
        return Participant_vcs.res
      } else {
        throw new ConflictException(Participant_vcs.res + ` for ${VP_type} compliance credential issuance`)
      }
    }
    if (VP_type == 'ServiceOfferingExperimental') {
      const SO_vcs = vp_graph.CheckSOGraph()
      if (SO_vcs.status == true) {
        return SO_vcs.res
      } else {
        throw new ConflictException(SO_vcs.res + ` for ${VP_type} compliance credential issuance`)
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

  private GetType(vcs: VerifiableCredentialDto<CredentialSubjectDto>[]) {
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
    vp_graph: VP_graph<VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto | CredentialSubjectDto>>
  ) => void
} = {
  [SelfDescriptionTypes.PARTICIPANT]: async (vc: VerifiableCredentialDto<CredentialSubjectDto>, vp_graph) => {
    if (!vp_graph.nodes.has(vc.credentialSubject.id)) {
      vp_graph.nodes.set(vc.credentialSubject.id, [])
      vp_graph.nodes.get(vc.credentialSubject.id).push(new VP_Node('LegalPerson', vc))
    } else {
      if (!vp_graph.CheckTypeExistance('LegalPerson', vc.id)) {
        vp_graph.nodes.get(vc.credentialSubject.id).push(new VP_Node('LegalPerson', vc))
      }
    }
  },
  [SelfDescriptionTypes.SERVICE_OFFERING]: async (vc: VerifiableCredentialDto<ServiceOfferingSelfDescriptionDto>, vp_graph) => {
    if (!vp_graph.nodes.has(vc.credentialSubject.id)) {
      if (vp_graph.nodes.has(vc.credentialSubject['gx-service-offering:providedBy'])) {
        vp_graph.nodes
          .get(vc.credentialSubject['gx-service-offering:providedBy'])
          .push(new VP_Node('ServiceOfferingExperimental', vc, vc.credentialSubject['gx-service-offering:providedBy']))
        vp_graph.nodes.set(vc.credentialSubject.id, vp_graph.nodes.get(vc.credentialSubject['gx-service-offering:providedBy']))
        vp_graph.nodes.delete(vc.credentialSubject['gx-service-offering:providedBy'])
      } else {
        vp_graph.nodes.set(vc.credentialSubject.id, [])
        vp_graph.nodes
          .get(vc.credentialSubject.id)
          .push(new VP_Node('ServiceOfferingExperimental', vc, vc.credentialSubject['gx-service-offering:providedBy']))
      }
    } else {
      if (!vp_graph.CheckTypeExistance('ServiceOfferingExperimental', vc.credentialSubject.id)) {
        vp_graph.nodes[vc.credentialSubject.id].push(new VP_Node('ServiceOfferingExperimental', vc, vc.credentialSubject.providedBy))
      }
    }
  },
  [SelfDescriptionTypes.PARTICIPANT_CREDENTIAL]: async (vc, vp_graph) => {
    //Todo : recup clé + get(clé) + push result
    const providedBy = vp_graph.CheckProvidedByNode(vc.credentialSubject.id)
    if (!providedBy.status) {
      vp_graph.nodes.set(vc.credentialSubject.id, [])
      vp_graph.nodes
        .get(vc.credentialSubject.id)
        .push(new VP_Node('ParticipantCredential', vc, vc.credentialSubject['gx-service-offering:providedBy']))
    } else {
      const id = providedBy.response.leaf.credentialSubject.id
      if (!vp_graph.CheckTypeExistance('ParticipantCredential', id)) {
        vp_graph.nodes.get(id).push(new VP_Node('ParticipantCredential', vc))
      }
    }
  },
  [SelfDescriptionTypes.TERMS_AND_CONDITION]: async (vc: VerifiableCredentialDto<CredentialSubjectDto>, vp_graph) => {
    if (!vp_graph.nodes.has(vc.credentialSubject.id)) {
      vp_graph.nodes.set(vc.credentialSubject.id, [])
      vp_graph.nodes.get(vc.credentialSubject.id).push(new VP_Node('TermsAndCondition', vc))
    } else {
      if (!vp_graph.CheckTypeExistance('TermsAndCondition', vc.credentialSubject.id)) {
        vp_graph.nodes.get(vc.credentialSubject.id).push(new VP_Node('TermsAndCondition', vc))
      }
    }
  },
  [SelfDescriptionTypes.REGISTRATION_NUMBER]: async (vc: VerifiableCredentialDto<CredentialSubjectDto>, vp_graph) => {
    if (!vp_graph.nodes.has(vc.credentialSubject.id)) {
      vp_graph.nodes.set(vc.credentialSubject.id, [])
      vp_graph.nodes.get(vc.credentialSubject.id).push(new VP_Node('RegistrationNumber', vc))
    } else {
      if (!vp_graph.CheckTypeExistance('RegistrationNumber', vc.credentialSubject.id)) {
        vp_graph.nodes.get(vc.credentialSubject.id).push(new VP_Node('RegistrationNumber', vc))
      }
    }
  }
}
