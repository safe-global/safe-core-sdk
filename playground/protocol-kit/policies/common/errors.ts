// SPDX-License-Identifier: FSL-1.1-MIT

import { type Address, BaseError, ContractFunctionRevertedError, decodeErrorResult, type Hex } from 'viem';
import { GUARD_ERRORS_ABI } from './abis.ts';

/**
 * The innermost cause of a failed call, decoded against every guard and policy error. A
 * `PolicyReverted` names the policy and the error it rejected the call with.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof BaseError)) {
    return error instanceof Error ? error.message : String(error);
  }
  const revert = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
  if (!(revert instanceof ContractFunctionRevertedError)) {
    return error.shortMessage;
  }
  const decoded = revert.data;
  if (decoded?.errorName === 'PolicyReverted') {
    const [policy, reason] = decoded.args as readonly [Address, Hex];
    return `PolicyReverted: ${policy} rejected it with ${describePolicyError(reason)}`;
  }
  if (decoded) {
    return `${decoded.errorName}(${(decoded.args ?? []).join(', ')})`;
  }
  return revert.reason ?? revert.shortMessage;
}

/** A policy's revert data as `Error(args)`, or the raw data for an error outside the known ABI. */
function describePolicyError(reason: Hex): string {
  try {
    const nested = decodeErrorResult({ abi: GUARD_ERRORS_ABI, data: reason });
    return `${nested.errorName}(${(nested.args ?? []).join(', ')})`;
  } catch {
    return reason;
  }
}
