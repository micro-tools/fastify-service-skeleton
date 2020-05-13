import { createRootLogger } from './root_logger'
import { nextLog, createDestinationStream } from './logger_test_utils'

describe('RootLogger', () => {
  it('allows to create children', async () => {
    const destination = createDestinationStream()
    const logger = createRootLogger('myService', { destination })
    const childLogger = logger.child({ childProp: 'childProp' })
    const logPromise = nextLog(destination)
    childLogger.info('hello')
    const log = await logPromise
    expect(log.childProp).toBe('childProp')
  })

  it('children log required fields', async () => {
    const destination = createDestinationStream()
    const rootLogger = createRootLogger('myService', { destination })
    const logger = rootLogger.child({})
    const logPromise = nextLog(destination)
    logger.info('hello')
    const log = await logPromise

    expect(typeof log['@timestamp']).toBe('string')
    const timestampDiff = Date.now() - Date.parse(log['@timestamp'] as string)
    expect(timestampDiff).toBeGreaterThanOrEqual(0)
    expect(timestampDiff).toBeLessThan(10000)
    const timeDiff = Date.now() - (log.time as number)
    expect(timeDiff).toBeGreaterThanOrEqual(0)
    expect(timeDiff).toBeLessThan(10000)
    expect(log.loglevel).toBe('INFO')
    expect(log.application_type).toBe('service')
    expect(log.service).toBe('myService')
    expect(typeof log.host).toBe('string')
  })
})
