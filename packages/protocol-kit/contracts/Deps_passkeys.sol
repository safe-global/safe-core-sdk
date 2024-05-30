// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import {SafeWebAuthnSignerFactory} from '@safe-global/safe-passkey/contracts/SafeWebAuthnSignerFactory.sol';
import {FCLP256Verifier} from '@safe-global/safe-passkey/contracts/verifiers/FCLP256Verifier.sol';

contract SafeWebAuthnSignerFactory_SV1_4_1 is SafeWebAuthnSignerFactory {}

contract WebAuthnContract is FCLP256Verifier {}
