import { readFileSync, writeFileSync } from 'fs'
import { importX509, KeyLike } from 'jose'
import { join } from 'path'

export class CertificateUtil {
  public static readonly X509_CERTIFICATE_CHAIN_FILE_PATH: string = join(__dirname, '../../static/.well-known/x509CertificateChain.pem')

  /**
   * Imports the <code>rawCertificate</code> in PEM format as an x509 certificate.
   * The raw certificate is also written to the filesystem for later use.
   * <p>
   * If the input <code>rawCertificate</code> is not provided, the filesystem
   * certificate file is read and imported in its place.
   * </p>
   *
   * @param rawCertificate the raw x509 certificate in PEM format
   * @returns a {@link Promise<KeyLike>} that resolves to the loaded certificate
   */
  static async loadCertificate(rawCertificate: string): Promise<KeyLike> {
    if (!!rawCertificate) {
      writeFileSync(CertificateUtil.X509_CERTIFICATE_CHAIN_FILE_PATH, rawCertificate)
    }

    // the algorithm argument is only necessary in Web Crypto API runtimes
    return await importX509(rawCertificate ?? readFileSync(CertificateUtil.X509_CERTIFICATE_CHAIN_FILE_PATH, 'utf-8'), null)
  }
}
