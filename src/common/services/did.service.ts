// TODO explain why this exists
import { Injectable, OnModuleInit } from '@nestjs/common'
import { DIDDocument, DIDDocumentMetadata, Resolver } from 'did-resolver'
import webDid from 'web-did-resolver'

@Injectable()
export class DidService implements OnModuleInit {
  private resolver: Resolver

  async onModuleInit(): Promise<void> {
    // This is based on the solution provided in https://github.com/microsoft/TypeScript/issues/43329#issuecomment-1669659858 as key-did-resolver is an ESM module
    const keyDid = (await Function('return import("key-did-resolver")')()) as typeof import('key-did-resolver')

    this.resolver = new Resolver({
      ...webDid.getResolver(),
      ...keyDid.getResolver()
    })
  }

  // TODO explain what this does
  async checkDid(did: string): Promise<DIDDocumentMetadata> {
    return await this.resolver.resolve(did)
  }

  async resolveDid(did: string): Promise<DIDDocument> {
    const result: DIDDocumentMetadata = await this.checkDid(did)

    const error = result.didResolutionMetadata.error
    if (error) {
      throw new Error(error) // TODO make this human-friendly
    }

    return result.didDocument
  }
}
