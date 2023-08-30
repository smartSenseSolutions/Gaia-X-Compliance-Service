'use strict'


import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'

import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { NodeTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { OTTracePropagator } from '@opentelemetry/propagator-ot-trace'

const hostName = process.env.OTEL_TRACE_HOST || 'localhost'

const options = {
  tags: [],
  endpoint: `http://${hostName}:14268/api/traces`
}

export const init = (serviceName, environment) => {
  const exporter = new JaegerExporter(options)

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment
    })
  })

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter))

  provider.register({ propagator: new OTTracePropagator() })

  console.log('tracing initialized')

  registerInstrumentations({
    instrumentations: [new ExpressInstrumentation(), new HttpInstrumentation()]
  })

  const tracer = provider.getTracer(serviceName)
  return { tracer }
}

module.exports = {
  init: init
}
