import { describe } from 'mocha';
import chai from 'chai';
import { getSafeAddressFromDeploymentTx } from '@safe-global/protocol-kit/contracts/utils';
import type { FormattedTransactionReceipt, Log } from 'viem';

const { expect } = chai;

describe('getSafeAddressFromDeploymentTx', () => {
  const mockSafeAddress = '0x123456789A123456789A123456789A123456789A';

  const createMockLog = (
    topics: `0x${string}`[] | null = [],
    data: `0x${string}` = '0x'
  ): Log<bigint, number, false> => ({
    address: '0x1234567890123456789012345678901234567890',
    topics: topics as [`0x${string}`],
    data,
    blockHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
    blockNumber: 1n,
    transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
    transactionIndex: 0,
    logIndex: 0,
    removed: false
  });

  const createMockReceipt = (logs: Log<bigint, number, false>[]): FormattedTransactionReceipt => ({
    blockHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
    blockNumber: 1n,
    contractAddress: null,
    cumulativeGasUsed: 100000n,
    effectiveGasPrice: 1000000000n,
    from: '0x0000000000000000000000000000000000000001',
    gasUsed: 50000n,
    logs,
    logsBloom: '0x00',
    status: 'success',
    to: '0x0000000000000000000000000000000000000002',
    transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
    transactionIndex: 0,
    type: 'eip1559'
  });

  describe('with Safe v1.3.0', () => {
    const eventTopic = '0xa38789425dbeee0239e16ff2d2567e31720127fbc6430758c1a4efc6aef29f80' as const;
    const proxyData = `0x000000000000000000000000${mockSafeAddress.slice(2)}0000000000000000000000000000000000000000000000000000000000000000` as `0x${string}`;

    it('should extract address from standard ProxyCreation event format', () => {
      const mockLog = createMockLog([eventTopic], proxyData);
      const receipt = createMockReceipt([mockLog]);
      
      const extractedAddress = getSafeAddressFromDeploymentTx(receipt, '1.3.0');
      expect(extractedAddress.toLowerCase()).to.equal(mockSafeAddress.toLowerCase());
    });

    it('should handle logs without proper topics but valid data', () => {
      const mockLog = createMockLog([], proxyData);
      const receipt = createMockReceipt([mockLog]);
      
      const extractedAddress = getSafeAddressFromDeploymentTx(receipt, '1.3.0');
      expect(extractedAddress.toLowerCase()).to.equal(mockSafeAddress.toLowerCase());
    });

    it('should handle custom RPC logs with null topics', () => {
      const mockLog = createMockLog(null, proxyData);
      const receipt = createMockReceipt([mockLog]);
      
      const extractedAddress = getSafeAddressFromDeploymentTx(receipt, '1.3.0');
      expect(extractedAddress.toLowerCase()).to.equal(mockSafeAddress.toLowerCase());
    });
  });

  describe('with Safe v1.0.0', () => {
    const eventTopic = '0x4f51faf6c4561ff95f067657e43439f0f856d97c04d9ec9070a6199ad418e235' as const;
    const proxyData = `0x000000000000000000000000${mockSafeAddress.slice(2)}` as `0x${string}`;

    it('should extract address from legacy ProxyCreation event format', () => {
      const mockLog = createMockLog([eventTopic], proxyData);
      const receipt = createMockReceipt([mockLog]);
      
      const extractedAddress = getSafeAddressFromDeploymentTx(receipt, '1.0.0');
      expect(extractedAddress.toLowerCase()).to.equal(mockSafeAddress.toLowerCase());
    });

    it('should handle legacy logs without proper topics', () => {
      const mockLog = createMockLog([], proxyData);
      const receipt = createMockReceipt([mockLog]);
      
      const extractedAddress = getSafeAddressFromDeploymentTx(receipt, '1.0.0');
      expect(extractedAddress.toLowerCase()).to.equal(mockSafeAddress.toLowerCase());
    });
  });

  describe('error cases', () => {
    it('should throw if no valid ProxyCreation event is found', () => {
      const mockLog = createMockLog([], '0x');
      const receipt = createMockReceipt([mockLog]);

      expect(() => getSafeAddressFromDeploymentTx(receipt, '1.3.0'))
        .to.throw('SafeProxy was not deployed correctly');
    });

    it('should throw if receipt has no logs', () => {
      const receipt = createMockReceipt([]);
      expect(() => getSafeAddressFromDeploymentTx(receipt, '1.3.0'))
        .to.throw('SafeProxy was not deployed correctly');
    });

    it('should throw if logs array is null', () => {
      const receipt = {
        ...createMockReceipt([]),
        logs: null
      } as unknown as FormattedTransactionReceipt;

      expect(() => getSafeAddressFromDeploymentTx(receipt, '1.3.0'))
        .to.throw('SafeProxy was not deployed correctly');
    });
  });
});
