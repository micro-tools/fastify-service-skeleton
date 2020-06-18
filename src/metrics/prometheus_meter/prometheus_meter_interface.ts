import type {
  Counter,
  CounterConfiguration,
  Gauge,
  GaugeConfiguration,
  Histogram,
  HistogramConfiguration,
  Registry,
  Summary,
  SummaryConfiguration,
} from "prom-client"

/**
 * A PrometheusMeter is a metric factory and inspired by the OpenTelemetry Metrics Meter concept.
 * It enables libraries to only depend on this interface instead of a concrete prom-client implementation.
 */
export interface PrometheusMeter {
  defaultRegisters: Registry[]
  createCounter<Labels extends string>(
    config: CounterConfiguration<Labels>
  ): Counter<Labels>
  createGauge<Labels extends string>(
    config: GaugeConfiguration<Labels>
  ): Gauge<Labels>
  createHistogram<Labels extends string>(
    config: HistogramConfiguration<Labels>
  ): Histogram<Labels>
  createSummary<Labels extends string>(
    config: SummaryConfiguration<Labels>
  ): Summary<Labels>
}

// Re-export metric types
export { Counter, Gauge, Histogram, Registry, Summary }
