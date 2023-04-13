import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ComplianceCredentialDto, VerifiableCredentialDto } from '../dto'
import { Kafka, KafkaConfig, Producer } from 'kafkajs'

@Injectable()
export class PublisherService implements OnModuleDestroy {
  private kafka: Kafka
  private VPProducer: Producer

  constructor() {
    const kafkaConfig: KafkaConfig = {
      brokers: process.env.KAFKA_BROKERS!.split(','),
      clientId: process.env.KAFKA_CLIENT_ID,
      ssl: {
        ca: process.env.SSL_CA,
        cert: process.env.SSL_CERTIFICATE,
        key: process.env.SSL_KEY
      }
    }
    this.kafka = new Kafka(kafkaConfig)
    this.VPProducer = this.kafka.producer()
    this.VPProducer.connect()
  }

  async publishVP(VP: VerifiableCredentialDto<ComplianceCredentialDto>) {
    await this.VPProducer.send({
      topic: 'credential_offers',
      messages: [{ key: VP.id, value: JSON.stringify(VP) }]
    })
  }

  onModuleDestroy(): any {
    this.VPProducer.disconnect()
  }
}
