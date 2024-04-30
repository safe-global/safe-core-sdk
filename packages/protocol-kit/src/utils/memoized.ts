import SafeProvider from '../SafeProvider'

export function createMemoizedFunction<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  cache: Record<string, ReturnType<T>> = {}
) {
  const replacer = createSafeContractSerializerReplacer()
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args, replacer)

    cache[key] = cache[key] || callback(...args)

    return cache[key]
  }
}

// EIP1193 providers from web3.currentProvider and hre.network.provider fail to serialize BigInts
function createSafeContractSerializerReplacer() {
  const seen = new Set()

  return (_: string, value: unknown) => {
    // Serialize Bigints as strings
    if (typeof value === 'bigint') {
      return value.toString()
    }

    // Avoid circular references
    if (value instanceof SafeProvider && value !== null) {
      if (seen.has(value)) {
        return undefined
      }
      seen.add(value)
      return {
        $safeProvider: {
          provider: typeof value.provider === 'object' ? 'EIP1193Provider' : value.provider,
          signer: value.signer
        }
      }
    }

    return value
  }
}
