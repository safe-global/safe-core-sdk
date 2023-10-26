export interface CompatibilityFallbackHandlerContract {
  getAddress(): Promise<string>
  encode(methodName: any, params: any): string
}
