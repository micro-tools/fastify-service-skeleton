import { Registry, Metric } from "prom-client"
import { PrometheusMeter } from "./prometheus_meter_interface"
import {
  createPrometheusMeter,
  duplicateStrategies,
  MetricConfiguration,
  DuplicateStrategy,
} from "./prometheus_meter_factory"

test("Multiple metric instantiations with the same config throw an error by default (promClient default)", async () => {
  const promMeter = createPrometheusMeter([new Registry()])
  const testVariants = createTestVariants({
    promMeter,
    duplicateStrategy: undefined,
  })
  for (const [createMetric, config] of testVariants) {
    createMetric(config)
    expect(() => {
      createMetric(config)
    }).toThrowError()
  }
})

test("Multiple metric instantiations with the same config throw an error if `duplicateStrategy` is `preventAllDuplicates`", async () => {
  const promMeter = createPrometheusMeter([new Registry()])
  const testVariants = createTestVariants({
    promMeter,
    duplicateStrategy: duplicateStrategies.preventAnyDuplicate,
  })
  for (const [createMetric, config] of testVariants) {
    createMetric(config)
    expect(() => {
      createMetric(config)
    }).toThrowError()
  }
})

test("Multiple metric instantiations with the same config do not throw an error if `duplicateStrategy` is `returnExistingIfPropsAreEqual`", async () => {
  const promMeter = createPrometheusMeter([new Registry()])
  const testVariants = createTestVariants({
    promMeter,
    duplicateStrategy: duplicateStrategies.returnExistingIfPropsAreEqual,
  })
  for (const [createMetric, config] of testVariants) {
    createMetric(config)
    expect(() => {
      createMetric(config)
    }).not.toThrowError()
  }
})

test("Multiple metric instantiations with a different config throw an error if `duplicateStrategy` is `returnExistingIfPropsAreEqual`", async () => {
  const promMeter = createPrometheusMeter([new Registry()])
  const testVariants = createTestVariants({
    promMeter,
    duplicateStrategy: duplicateStrategies.returnExistingIfPropsAreEqual,
  })
  for (const [createMetric, config] of testVariants) {
    createMetric(config)
    expect(() => {
      createMetric({ ...config, help: "different help text" })
    }).toThrowError()
  }
})

function createTestVariants({
  promMeter,
  duplicateStrategy,
}: {
  promMeter: PrometheusMeter
  duplicateStrategy: DuplicateStrategy | undefined
}): Array<
  [(config: MetricConfiguration) => Metric<string>, MetricConfiguration]
> {
  return [
    [
      promMeter.createCounter,
      {
        name: "test_counter",
        help: "test_counter",
        duplicateStrategy,
      },
    ],
    [
      promMeter.createCounter,
      {
        name: "test_counter_with_labels",
        help: "test_counter_with_labels",
        labelNames: ["a", "b"],
        duplicateStrategy,
      },
    ],
    [
      promMeter.createGauge,
      {
        name: "test_gauge",
        help: "test_gauge",
        duplicateStrategy,
      },
    ],
    [
      promMeter.createGauge,
      {
        name: "test_gauge_with_labels",
        help: "test_gauge_with_labels",
        labelNames: ["a", "b"],
        duplicateStrategy,
      },
    ],
    [
      promMeter.createHistogram,
      {
        name: "test_histogram",
        help: "test_histogram",
        duplicateStrategy,
      },
    ],
    [
      promMeter.createHistogram,
      {
        name: "test_histogram_with_labels",
        help: "test_histogram_with_labels",
        labelNames: ["a", "b"],
        duplicateStrategy,
      },
    ],
    [
      promMeter.createSummary,
      {
        name: "test_summary",
        help: "test_summary",
        duplicateStrategy,
      },
    ],
    [
      promMeter.createSummary,
      {
        name: "test_summary_with_labels",
        help: "test_summary_with_labels",
        labelNames: ["a", "b"],
        duplicateStrategy,
      },
    ],
  ]
}
