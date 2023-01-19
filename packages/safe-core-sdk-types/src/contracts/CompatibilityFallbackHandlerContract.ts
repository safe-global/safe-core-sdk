export interface CompatibilityFallbackHandlerContract {
  getAddress(): string
  encode(methodName: any, params: any): string
}
