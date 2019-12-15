import { createLogger } from './logger'
import { nextLog, createDestinationStream } from './utils/logger_test_utils'

describe('Logger', () => {
  it('logs required fields', async () => {
    const destination = createDestinationStream()
    const logger = createLogger('application', {
      serviceName: 'myService',
      destination,
    })
    const logPromise = nextLog(destination)
    logger.info('hello')
    const log = await logPromise

    expect(typeof log['@timestamp']).toBe('string')
    const timestampDiff = Date.now() - Date.parse(log['@timestamp'])
    expect(timestampDiff).toBeGreaterThanOrEqual(0)
    expect(timestampDiff).toBeLessThan(10000)
    const timeDiff = Date.now() - log.time
    expect(timeDiff).toBeGreaterThanOrEqual(0)
    expect(timeDiff).toBeLessThan(10000)
    expect(log.loglevel).toBe('INFO')
    expect(log.log_type).toBe('application')
    expect(log.application_type).toBe('service')
    expect(log.service).toBe('myService')
    expect(typeof log.host).toBe('string')
  })

  it('can be extended with child properties', async () => {
    const destination = createDestinationStream()
    const logger = createLogger('application', {
      serviceName: 'myService',
      destination,
    })
    const childLogger = logger.child({ childProp: 'childProp' })
    const logPromise = nextLog(destination)
    childLogger.info('hello')
    const log = await logPromise
    expect(log.childProp).toBe('childProp')
  })
})
