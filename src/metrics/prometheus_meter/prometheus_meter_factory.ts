import * as R from "remeda"
import * as promClient from "prom-client"
import type { PrometheusMeter } from "./prometheus_meter_interface"

export function createPrometheusMeter(
  defaultRegisters: promClient.Registry[],
  Counter = promClient.Counter,
  Gauge = promClient.Gauge,
  Histogram = promClient.Histogram,
  Summary = promClient.Summary
): PrometheusMeter {
  return {
    defaultRegisters,

    createCounter<Labels extends string>(
      config: promClient.CounterConfiguration<Labels> & ExtraMetricOptions
    ): promClient.Counter<Labels> {
      return createMetric(Counter, defaultRegisters, config)
    },

    createGauge<Labels extends string>(
      config: promClient.GaugeConfiguration<Labels> & ExtraMetricOptions
    ): promClient.Gauge<Labels> {
      return createMetric(Gauge, defaultRegisters, config)
    },

    createHistogram<Labels extends string>(
      config: promClient.HistogramConfiguration<Labels> & ExtraMetricOptions
    ): promClient.Histogram<Labels> {
      return createMetric(Histogram, defaultRegisters, config)
    },

    createSummary<Labels extends string>(
      config: promClient.SummaryConfiguration<Labels> & ExtraMetricOptions
    ): promClient.Summary<Labels> {
      return createMetric(Summary, defaultRegisters, config)
    },
  }
}

export const duplicateStrategies = {
  preventAnyDuplicate,
  returnExistingIfPropsAreEqual,
}

function createMetric<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MetricCls extends new (...args: any[]) => Metric,
  Metric extends promClient.Metric<Labels>,
  Labels extends string
>(
  MetricClass: MetricCls,
  defaultRegisters: promClient.Registry[],
  config: MetricConfiguration
): Metric {
  const finalConfig = {
    ...config,
    registers: config.registers || defaultRegisters,
  }
  if (typeof config.duplicateStrategy === "function") {
    const { registeredIn, notRegisteredIn } = devideRegisters(
      finalConfig.registers,
      finalConfig.name
    )
    return config.duplicateStrategy(
      MetricClass,
      finalConfig,
      registeredIn,
      notRegisteredIn
    )
  } else {
    // Do not perform any duplicate strategy and use promClient's default behaviour
    return new MetricClass(finalConfig)
  }
}

/**
 * Divides `registers` into:
 * - `registeredIn`: those that already contain a metric with the same name
 * - `notRegisteredIn`: all other
 */
function devideRegisters(
  registers: promClient.Registry[],
  metricName: string
): {
  registeredIn: Array<{
    registry: promClient.Registry
    metric: promClient.Metric<string>
  }>
  notRegisteredIn: promClient.Registry[]
} {
  const registeredIn: Array<{
    registry: promClient.Registry
    metric: promClient.Metric<string>
  }> = []
  const notRegisteredIn: promClient.Registry[] = []
  for (const registry of registers) {
    const metric = registry.getSingleMetric(metricName)
    if (metric !== undefined) {
      registeredIn.push({ registry, metric })
    } else {
      notRegisteredIn.push(registry)
    }
  }
  return { registeredIn, notRegisteredIn }
}

function preventAnyDuplicate<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MetricCls extends new (...args: any[]) => Metric,
  Metric extends promClient.Metric<Labels>,
  Labels extends string
>(
  MetricClass: MetricCls,
  config: MetricConfiguration<Labels>,
  registeredIn: Array<{
    registry: promClient.Registry
    metric: promClient.Metric<string>
  }>,
  _notRegisteredIn: promClient.Registry[]
): Metric {
  if (registeredIn.length > 0) {
    throw new Error(
      `A metric with the name '${config.name}' has already been registered.`
    )
  }
  return new MetricClass(config)
}

function returnExistingIfPropsAreEqual<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MetricCls extends new (...args: any[]) => Metric,
  Metric extends promClient.Metric<Labels>,
  Labels extends string
>(
  MetricClass: MetricCls,
  config: MetricConfiguration<Labels>,
  registeredIn: Array<{
    registry: promClient.Registry
    metric: promClient.Metric<string>
  }>,
  notRegisteredIn: promClient.Registry[]
): Metric {
  if (registeredIn.length < 1) {
    // Just create the metric
    return new MetricClass(config)
  } else {
    // => The metric is already registered in at least one registry
    // Check config property equality
    for (const { metric } of registeredIn) {
      if (!(metric instanceof MetricClass)) {
        throw new Error(
          `The re-registration of a metric with the name '${config.name}' is only allowed if they are of the same metric type.`
        )
      }
      const propsToCheck = ["name", "help", "labelNames"]
      const existingMetricProps = R.pick(
        (metric as unknown) as Record<string, unknown>,
        propsToCheck
      )
      const newMetricProps = R.pick(
        (config as unknown) as Record<string, unknown>,
        propsToCheck
      )
      newMetricProps["labelNames"] = newMetricProps["labelNames"] || []
      if (!R.equals(existingMetricProps, newMetricProps)) {
        throw new Error(
          `The re-registration of a metric with the name '${
            config.name
          }' is only allowed if all of these properties equal: ${propsToCheck.join(
            ", "
          )}`
        )
      }
    }
    // Check if they are registered in the same registries
    if (notRegisteredIn.length > 0) {
      throw new Error(
        `The re-registration of a metric with the name '${config.name}' is only allowed if their registries equal.`
      )
    }
    // Return existing metric from the first registry
    return registeredIn[0].metric as Metric
  }
}

export type CounterConfiguration<
  Label extends string = string
> = promClient.CounterConfiguration<Label> & ExtraMetricOptions
export type GaugeConfiguration<
  Label extends string = string
> = promClient.GaugeConfiguration<Label> & ExtraMetricOptions
export type HistogramConfiguration<
  Label extends string = string
> = promClient.HistogramConfiguration<Label> & ExtraMetricOptions
export type SummaryConfiguration<
  Label extends string = string
> = promClient.SummaryConfiguration<Label> & ExtraMetricOptions

export type MetricConfiguration<Label extends string = string> =
  | CounterConfiguration<Label>
  | GaugeConfiguration<Label>
  | HistogramConfiguration<Label>
  | SummaryConfiguration<Label>

interface ExtraMetricOptions {
  duplicateStrategy?: DuplicateStrategy
}

export type DuplicateStrategy = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MetricCls extends new (...args: any[]) => Metric,
  Metric extends promClient.Metric<Labels>,
  Labels extends string
>(
  MetricClass: MetricCls,
  config: MetricConfiguration<Labels>,
  registeredIn: Array<{
    registry: promClient.Registry
    metric: promClient.Metric<string>
  }>,
  notRegisteredIn: promClient.Registry[]
) => Metric
