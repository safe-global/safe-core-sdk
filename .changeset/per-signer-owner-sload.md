---
'@safe-global/protocol-kit': patch
---

Tighten `estimateTxBaseGas` to better cover the gas the relayer actually spends executing `execTransaction`, with the largest impact on high-gas-price chains. Improvements include:

- Per-signer cold `owners[signer]` SLOAD (EIP-2929) is now charged for every signature instead of only the first, fixing a linear undercount for Safes with threshold > 1.
- `SafeProxy` fallback overhead (cold singleton SLOAD, cold DELEGATECALL surcharge, calldata/returndata shuffling) is now modelled as a flat ~5,000 gas paid before the singleton runs.
- SafeL2 `onBeforeExecTransaction` overhead beyond the raw LOG opcode cost (hook dispatch, `additionalInfo` construction, ABI-encoding mstores, CALLDATACOPY, and memory expansion) is now charged at ~600 gas.
- ERC20 refund gas is now probed via `eth_estimateGas` on a `transfer` from the Safe to the refund receiver, falling back to the existing static constants on revert (e.g. when the Safe holds no token balance). Captures proxied tokens (UChildERC20Proxy, transparent proxies) and tokens with hooks that the static constants didn't reflect.
- `ECRECOVER_GAS_COST` corrected from 6_000 to 3_100 (3_000 precompile + 100 warm STATICCALL). The previous 6_000 value reflected pre-Berlin gas pricing (STATICCALL base 700 + ecrecover 3_000 rounded to 6K); post-Berlin (EIP-2929) precompiles are pre-warmed and STATICCALL costs 100.
