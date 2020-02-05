import { createHash, randomBytes, HexBase64Latin1Encoding } from 'crypto'

class CachedStringHasher {
  private memory: Record<string, Hashed> = {}

  hash(
    str: string,
    algorithm = 'sha256',
    encoding: HexBase64Latin1Encoding = 'base64',
  ): Hashed {
    if (this.memory.hasOwnProperty(str)) {
      return this.memory[str]
    }
    const salt = randomBytes(4).toString('hex')
    const hashed: Hashed = {
      hash: createHash(algorithm)
        .update(salt + str)
        .digest(encoding),
      prependedSalt: salt,
      algorithm,
      encoding,
    }
    this.memory[str] = hashed
    return hashed
  }
}

export const cachedStringHasher = new CachedStringHasher()

export interface Hashed {
  hash: string
  prependedSalt: string
  algorithm: string
  encoding: string
}