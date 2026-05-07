import { setupMonocle } from 'monocle2ai';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// #region agent log - H-A/H-B: enable OTEL diag logger to surface OTLPTraceExporter errors
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
// #endregion

setupMonocle('app-service-ai', [
  new BatchSpanProcessor(new OTLPTraceExporter())
]);

// const sdk = new NodeSDK({
//   traceExporter: new OTLPTraceExporter(),
//   metricReader: new PeriodicExportingMetricReader({
//     exporter: new OTLPMetricExporter(),
//   }),
//   instrumentations: [
//     getNodeAutoInstrumentations()
//   ],
//   serviceName: 'app-service',
// });

// sdk.start();