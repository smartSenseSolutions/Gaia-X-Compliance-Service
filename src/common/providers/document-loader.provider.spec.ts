import { FactoryProvider } from '@nestjs/common'
import { DocumentLoader } from '@gaia-x/json-web-signature-2020'
import jsonld from 'jsonld'
import { DocumentLoaderProvider } from './document-loader.provider'

describe('DocumentLoaderProvider', () => {
  const configServiceMock = {
    get: jest.fn()
  }

  it('should create an offline document loader when WEB_DOCUMENT_LOADER is true', async () => {
    configServiceMock.get.mockReturnValue('true')

    const provider: FactoryProvider<DocumentLoader> = DocumentLoaderProvider.create()
    const documentLoader: DocumentLoader = await provider.useFactory(configServiceMock)

    expect(provider.provide).toEqual('documentLoader')
    expect(documentLoader).not.toEqual(jsonld.documentLoader)

    expect(configServiceMock.get).toHaveBeenCalledWith('WEB_DOCUMENT_LOADER')
  })

  it('should return the default jsonld document loader when WEB_DOCUMENT_LOADER is false', async () => {
    configServiceMock.get.mockReturnValue('false')

    const provider: FactoryProvider<DocumentLoader> = DocumentLoaderProvider.create()
    const documentLoader: DocumentLoader = await provider.useFactory(configServiceMock)

    expect(provider.provide).toEqual('documentLoader')
    expect(documentLoader).toEqual(jsonld.documentLoader)

    expect(configServiceMock.get).toHaveBeenCalledWith('WEB_DOCUMENT_LOADER')
  })
})
