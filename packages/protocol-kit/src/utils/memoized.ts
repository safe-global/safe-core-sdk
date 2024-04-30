export function createMemoizedFunction<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  cache: Record<string, ReturnType<T>> = {}
) {
  const replacer = createBigIntSerializerReplacer()
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args, replacer)

    cache[key] = cache[key] || callback(...args)

    return cache[key]
  }
}

// EIP1193 providers from web3.currentProvider and hre.network.provider fail to serialize BigInts
function createBigIntSerializerReplacer() {
  const seen = new Set()

  return (_: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined
      }
      seen.add(value)
    }

    if (typeof value === 'bigint') {
      return value.toString()
    }

    return value
  }
}
