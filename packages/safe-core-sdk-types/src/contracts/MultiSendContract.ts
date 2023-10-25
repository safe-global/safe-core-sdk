export interface MultiSendContract {
  getAddress(): Promise<string>
  encode(methodName: any, params: any): string
}
