import { FactoryProvider } from '@nestjs/common'
import { KeyObject } from 'crypto'
import { KeyLike } from 'jose'
import { PrivateKeyProvider } from './private-key.provider'

describe('PrivateKeyProvider', () => {
  const configServiceMock = {
    get: jest.fn()
  }

  afterEach(() => {
    ;(configServiceMock.get as jest.Mock).mockReset()
  })

  it('should return a crypto.KeyObject when private key is in PKCS#1 format', async () => {
    configServiceMock.get.mockReturnValue(
      '-----BEGIN RSA PRIVATE KEY-----\n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\n-----END RSA PRIVATE KEY-----'
    )

    const provider: FactoryProvider<KeyObject | KeyLike> = PrivateKeyProvider.create()
    const privateKey: KeyObject | KeyLike = await provider.useFactory(configServiceMock)

    expect(provider.provide).toEqual('privateKey')
    expect(privateKey).toBeInstanceOf(KeyObject)

    expect(configServiceMock.get).toHaveBeenCalledTimes(1)
    expect(configServiceMock.get).toHaveBeenCalledWith('privateKey')
  })

  it('should return a KeyLike object when private key is in PKCS#8 format', async () => {
    configServiceMock.get.mockReturnValue(
      '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1YUiOE0x2Bke5\nRGKUXLhKpSjATRe4vHOro8KYwlVq2kwRH9j/gWbGvEKDEVbVu9l1o+/QBZzP8DHd\n2i892GqO2dTuTj+vYiKUXiI6M2IFg7+1cSXpJq010vNSp8o96ZdWmNNdzz+sjl/k\nrjMC0FIWhWbavIvwxHYf+LBgVYUU9mvqp9GUuZrrxqaLmVmlb44hOt0OV1oE8eow\nqbgEo/lbXBBngVFdHrvZgQ3TueJ2uhcr+LouwvsNK2L5RyUzBqx3qc/E8kGgU/y4\neqP4M4S2g36zUDuExUuzSjmRP/BodnDdDLwV72nuTXEO8GjHvL/e8fBJxCNxkmxf\n+YOsSmYFAgMBAAECggEADxxCauGlNEzsIz1U+BasXL2bIkAZ6pA6k7FCGC9SZeM3\nRJLyZUDOwt4yrVAfu5EZefE1HI+nI3SXduvDFUQnBm0TzeGTcSU8C7+22sHml96E\ntVUuixing+0ly7xCPzurWbHEJBPMsm+vAfJYOhMIT6t/6Ned0epQC/RQH0pompkT\nzDI6ddijc0hlQZF/I+3TLKsSEPd5RWCd3vwXKjPD5YuHxtAokvCaiTI6Tz2gwpNJ\n9vj5MYWpAYN6D+Chj4kd48NRv6UU8ivxPYpGvnmMLQ3h7Rs8YJ4bssPH+JM0Q10y\nwC4+j8R3S7KEuXvEMsIDZ9f3eHtoramCqU+9trFx0QKBgQDtfBcpad1+hBrgNXu3\nlLKCK551weI5ycFNke7TYdUhCY91kFcSGo3FnXaIu5eke4GKz8kgfvMX6os00bLo\nuEwo9PxlQSfKtoqJDk+X6ZFG2xW84egvNqGdF/8PWLTFOmKra1R3TfOtO4XUvCbL\nrcu5vmKlXdR+WXbeJwoTNha61QKBgQDDhWkKWUBeSYFiuSfzU6luQv00q0CufIjP\nL0QVBeMJobxpx2bbHPQJ4OaXW94E6IuTCotIf9cVVUQlaq3mIFGsoCwYxyd/umZG\nXAQLwJjzW62SygyOtZOIHfYcFDhe+hpgjq96OM7HmqEMZhUnhuyS1bhFMSA5xko3\nzail5/U2cQKBgF2SDRY2Lh1RM72vlQVqQ0NiqFbBg789LTrBCxaib3VK7QlnS8dI\nSx/XwQJy13bpasskv5xcKK/9q8et8A4dv3RLwr6qg2Ettzv1NYsnbiQ64j+/ytn/\nboIVGFwVmXQ0Yvgjm+49+osA7uQ5FhgebCzNRNTfOYBnA5zYSPH019PZAoGBAJsR\n0m98vgqJ7e5ov4DDV9u1kbEWKeS5rJ/18t9hneHjvtV+attZqUu0be6Z1Aq8jQaA\nFFvZ2LJ4v+WVKHseIujw2EiGm5M4OSmQjTzs8eIBUjbbvP3qkSoh6TH374WUgxsV\nz6L2LzosL5Lv29NPtY33p4BpKA/qbq63lAyRXfBhAoGBANOe6L7hzGorRwn+G6ph\nedevej4FGVt8f4iY6EnIaxjrtMsHBEVXwiZXROyKg8FqXki7YxDQEHhLZHjsKqW5\n7G/KcUejjWfIIUrs9hNU3MB8UcZZmH64IwidqlY2L1pDbAxyWdW7Wf7G9VEazANO\nQtY1bg3j/h3E4S0Pet2UgDgi\n-----END PRIVATE KEY-----'
    )

    const provider: FactoryProvider<KeyObject | KeyLike> = PrivateKeyProvider.create()
    const privateKey: KeyLike = await provider.useFactory(configServiceMock)

    expect(provider.provide).toEqual('privateKey')
    expect(privateKey).not.toBeNull()

    expect(configServiceMock.get).toHaveBeenCalledTimes(1)
    expect(configServiceMock.get).toHaveBeenCalledWith('privateKey')
  })

  it('should throw an exception when PKCS#1 private key is invalid', () => {
    configServiceMock.get.mockReturnValue('-----BEGIN RSA PRIVATE KEY-----\nnot valid for sure\n-----END RSA PRIVATE KEY-----')

    const provider: FactoryProvider<KeyObject | KeyLike> = PrivateKeyProvider.create()
    expect(provider.useFactory(configServiceMock)).rejects.toThrowError()
  })

  it('should throw an exception when PKCS#8 private key is invalid', () => {
    configServiceMock.get.mockReturnValue('-----BEGIN PRIVATE KEY-----\nnot valid for sure\n-----END PRIVATE KEY-----')

    const provider: FactoryProvider<KeyObject | KeyLike> = PrivateKeyProvider.create()
    expect(provider.useFactory(configServiceMock)).rejects.toThrowError()
  })
})
