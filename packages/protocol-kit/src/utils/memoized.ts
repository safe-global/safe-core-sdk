export function createMemoizedFunction<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  cache: Record<string, ReturnType<T>> = {}
) {
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)

    cache[key] = cache[key] || callback(...args)

    return cache[key]
  }
}
