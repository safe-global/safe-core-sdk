export interface MultiSendCallOnlyContract {
  getAddress(): string
  encode(methodName: any, params: any): string
}
