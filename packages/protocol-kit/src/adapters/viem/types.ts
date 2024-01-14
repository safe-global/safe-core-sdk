import { Account, Chain, Client, Transport } from 'viem'

export type KeyedClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account = Account
> =
  | { public: Client<TTransport, TChain>; wallet: Client<TTransport, TChain, TAccount> }
  | { public: Client<TTransport, TChain> }
  | { wallet: Client<TTransport, TChain, TAccount> }
