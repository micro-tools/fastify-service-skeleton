import { Registry } from "prom-client"
import { PrometheusMeter } from "./prometheus_meter_interface"
import {
  createPrometheusMeter,
  duplicateStrategies,
  MetricConfiguration,
  DuplicateStrategy,
} from "./prometheus_meter_factory"

test("Multiple metric instantiations with the same config throw an error by default (promClient default)", () => {
  const promMeter = createPrometheusMeter([new Registry()])
  const testVariants = createTestVariants({
    promMeter,
    duplicateStrategy: undefined,
  })
  for (const [createMetric, config] of testVariants) {
    // @ts-expect-error compiler is not happy with it but it's ok
    createMetric(config)
    expect(() => {
      // @ts-expect-error compiler is not happy with it but it's ok
      createMetric(config)
    }).toThrowError()
  }
})

test("Multiple metric instantiations with the same config throw an error if `duplicateStrategy` is `preventAllDuplicates`", () => {
  const promMeter = createPrometheusMeter([new Registry()])
  const testVariants = createTestVariants({
    promMeter,
    duplicateStrategy: duplicateStrategies.preventAnyDuplicate,
  })
  for (const [createMetric, config] of testVariants) {
    // @ts-expect-error compiler is not happy with it but it's ok
    createMetric(config)
    expect(() => {
      // @ts-expect-error compiler is not happy with it but it's ok
      createMetric(config)
    }).toThrowError()
  }
})

test("Multiple metric instantiations with the same config do not throw an error if `duplicateStrategy` is `returnExistingIfPropsAreEqual`", () => {
  const promMeter = createPrometheusMeter([new Registry()])
  const testVariants = createTestVariants({
    promMeter,
    duplicateStrategy: duplicateStrategies.returnExistingIfPropsAreEqual,
  })
  for (const [createMetric, config] of testVariants) {
    // @ts-expect-error compiler is not happy with it but it's ok
    createMetric(config)
    expect(() => {
      // @ts-expect-error compiler is not happy with it but it's ok
      createMetric(config)
    }).not.toThrowError()
  }
})

test("Multiple metric instantiations with a different config throw an error if `duplicateStrategy` is `returnExistingIfPropsAreEqual`", () => {
  const promMeter = createPrometheusMeter([new Registry()])
  const testVariants = createTestVariants({
    promMeter,
    duplicateStrategy: duplicateStrategies.returnExistingIfPropsAreEqual,
  })
  for (const [createMetric, config] of testVariants) {
    // @ts-expect-error compiler is not happy with it but it's ok
    createMetric(config)
    expect(() => {
      // @ts-expect-error compiler is not happy with it but it's ok
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
}): Array<[MetricFactory, MetricConfiguration]> {
  return [
    [
      // eslint-disable-next-line @typescript-eslint/unbound-method
      promMeter.createCounter,
      {
        name: "test_counter",
        help: "test_counter",
        duplicateStrategy,
      },
    ],
    [
      // eslint-disable-next-line @typescript-eslint/unbound-method
      promMeter.createCounter,
      {
        name: "test_counter_with_labels",
        help: "test_counter_with_labels",
        labelNames: ["a", "b"],
        duplicateStrategy,
      },
    ],
    [
      // eslint-disable-next-line @typescript-eslint/unbound-method
      promMeter.createGauge,
      {
        name: "test_gauge",
        help: "test_gauge",
        duplicateStrategy,
      },
    ],
    [
      // eslint-disable-next-line @typescript-eslint/unbound-method
      promMeter.createGauge,
      {
        name: "test_gauge_with_labels",
        help: "test_gauge_with_labels",
        labelNames: ["a", "b"],
        duplicateStrategy,
      },
    ],
    [
      // eslint-disable-next-line @typescript-eslint/unbound-method
      promMeter.createHistogram,
      {
        name: "test_histogram",
        help: "test_histogram",
        duplicateStrategy,
      },
    ],
    [
      // eslint-disable-next-line @typescript-eslint/unbound-method
      promMeter.createHistogram,
      {
        name: "test_histogram_with_labels",
        help: "test_histogram_with_labels",
        labelNames: ["a", "b"],
        duplicateStrategy,
      },
    ],
    [
      // eslint-disable-next-line @typescript-eslint/unbound-method
      promMeter.createSummary,
      {
        name: "test_summary",
        help: "test_summary",
        duplicateStrategy,
      },
    ],
    [
      // eslint-disable-next-line @typescript-eslint/unbound-method
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

type MetricFactory =
  | PrometheusMeter["createCounter"]
  | PrometheusMeter["createGauge"]
  | PrometheusMeter["createHistogram"]
  | PrometheusMeter["createSummary"]
