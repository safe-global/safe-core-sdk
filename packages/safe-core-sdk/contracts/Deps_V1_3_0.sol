// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import { GnosisSafeProxyFactory } from "@gnosis.pm/safe-contracts-v1.3.0/contracts/proxies/GnosisSafeProxyFactory.sol";
import { GnosisSafe } from "@gnosis.pm/safe-contracts-v1.3.0/contracts/GnosisSafe.sol";
import { CompatibilityFallbackHandler } from "@gnosis.pm/safe-contracts-v1.3.0/contracts/handler/CompatibilityFallbackHandler.sol";
import { MultiSend } from "@gnosis.pm/safe-contracts-v1.3.0/contracts/libraries/MultiSend.sol";
import { MultiSendCallOnly } from "@gnosis.pm/safe-contracts-v1.3.0/contracts/libraries/MultiSendCallOnly.sol";
import { SignMessageLib } from "@gnosis.pm/safe-contracts-v1.3.0/contracts/examples/libraries/SignMessage.sol";
import { CreateCall } from "@gnosis.pm/safe-contracts-v1.3.0/contracts/libraries/CreateCall.sol";
import { DebugTransactionGuard } from "@gnosis.pm/safe-contracts-v1.3.0/contracts/examples/guards/DebugTransactionGuard.sol";
import { DefaultCallbackHandler } from "@gnosis.pm/safe-contracts-v1.3.0/contracts/handler/DefaultCallbackHandler.sol";

contract ProxyFactory_SV1_3_0 is GnosisSafeProxyFactory {}
contract GnosisSafe_SV1_3_0 is GnosisSafe {}
contract CompatibilityFallbackHandler_SV1_3_0 is CompatibilityFallbackHandler {}
contract MultiSend_SV1_3_0 is MultiSend {}
contract MultiSendCallOnly_SV1_3_0 is MultiSendCallOnly {}
contract SignMessageLib_SV1_3_0 is SignMessageLib {}
contract CreateCall_SV1_3_0 is CreateCall {}
contract DefaultCallbackHandler_SV1_3_0 is DefaultCallbackHandler {}
