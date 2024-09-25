import SafeApiKit, { SafeApiKitConfig } from './SafeApiKit'

export * from './types/safeTransactionServiceTypes'
export { SafeApiKitConfig }
export default SafeApiKit

declare module 'abitype' {
  export interface Register {
    AddressType: string
  }
}
