import { Account, Chain, PublicClient, Transport, WalletClient } from 'viem'

export type ClientPair = {
  public: PublicClient<Transport, Chain>
  wallet: WalletClient<Transport, Chain, Account>
}
