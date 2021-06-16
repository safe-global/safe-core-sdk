interface MultiSendContract {
  getAddress(): string
  encode(methodName: string, params: any[]): string
}

export default MultiSendContract
