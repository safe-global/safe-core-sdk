import { Account, Chain, Client, Transport } from 'viem'

export type KeyedClient<
  TTransport extends Transport,
  TChain extends Chain,
  TAccount extends Account
> =
  | { public: Client<TTransport, TChain>; wallet: Client<TTransport, TChain, TAccount> }
  | { public: Client<TTransport, TChain> }
  | { wallet: Client<TTransport, TChain, TAccount> }
