/**
 * Removes `readonly` modifier from all properties in T recursively.
 *
 * @template T - The type to make writable.
 */
export type DeepWriteable<T> = T extends object & NotFunction<T>
  ? { -readonly [K in keyof T]: DeepWriteable<T[K]> }
  : T

type Not<T, U> = T extends U ? never : T
type NotFunction<T> = Not<T, (...args: any) => any>
