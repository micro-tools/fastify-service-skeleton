import { createServiceSkeleton } from '../src'

async function main() {
  const app = createServiceSkeleton({ serviceName: 'example-service' })
  await app.listen(3000)
}

main()
