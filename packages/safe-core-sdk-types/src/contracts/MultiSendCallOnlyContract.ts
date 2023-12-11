export interface MultiSendCallOnlyContract {
  getAddress(): Promise<string>
  encode(methodName: any, params: any): string
}
