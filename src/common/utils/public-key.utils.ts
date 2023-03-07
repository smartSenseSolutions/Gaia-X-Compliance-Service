import { fstat, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { BadRequestException } from '@nestjs/common'
import { X509Certificate } from 'crypto'



export async function import_cert_chain() {
    if(process.env.TLS=="true") {
        const X509_CERTIFICATE_CHAIN_FILE_PATH = join(__dirname, '../../static/.well-known/x509CertificateChain.pem')
        writeFileSync(X509_CERTIFICATE_CHAIN_FILE_PATH,process.env.publicKey)
        return true
    }
    else return true
  }
  export function stripPEMInfo(PEMInfo: string): string {
    return PEMInfo.replace(/([']* -----(BEGIN|END) (CERTIFICATE|PKCS7)----- [']*|\n)/gm, '')
  }

     async function transform(body: any) {
    try {
       
      // split string into 1 item per certificate
      const split = body.split('-----BEGIN CERTIFICATE-----')

      // remove BEGIN CERTIFICATE etc. and filter empty leftover strings
      const raw = split.map(c => stripPEMInfo(c)).filter(c => c.length > 1)

      return raw
    } catch (error) {
      this.logger.error(error)
      throw new BadRequestException('Environment variable error, certificate chain could not be transformed.')
    }
  }
