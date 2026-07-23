---
'@safe-global/protocol-kit': patch
---

Improve `baseGas` accuracy in `estimateTxBaseGas`. The estimator now models several costs it previously omitted or approximated:

- Add the per-signer cold `owners[signer]` SLOAD (EIP-2929) to the per-signature cost, since `checkNSignatures` reads a distinct `owners` mapping slot for each signer.
- Correct the `ecrecover` cost to `3_100` (3_000 precompile + 100 STATICCALL) and update the misc overhead accordingly.
- Add `PROXY_FALLBACK_GAS_COST` for the singleton `delegatecall`.
- Add `L2_EVENT_ENCODING_GAS_COST` for the SafeL2 `SafeMultiSigTransaction` event's `abi.encode`/memory-expansion cost, beyond the raw LOG byte cost.
- For ERC20 refunds, probe the real `transfer` gas via `eth_estimateGas` (capturing proxy implementations and tokens with transfer hooks), with a fallback when the probe reverts.
