import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'
import { SafeService } from '../src/'
import sinon from 'sinon'
import { BigNumber } from '@ethersproject/bignumber'
import { SafeTransaction } from '@gnosis.pm/safe-core-sdk'
import { OperationType } from '@gnosis.pm/safe-core-sdk/dist/src/utils/transactions/SafeTransaction'

chai.use(chaiAsPromised)
chai.use(sinonChai)

describe('SafeServices', () => {
  describe('estimateSafeTx', async () => {
    it('should throw an error', async () => {
      const mockNetwork: any = {
        post: sinon.fake.throws(new Error('Test error'))
      }
      const service = new SafeService('some_base_url', mockNetwork)
      const safeTx = {
        to: 'to_address',
        value: 'some_value',
        data: 'some_data'
      }

      await chai
        .expect(service.estimateSafeTx('some_safe_address', safeTx))
        .to.be.rejectedWith('Test error')
      chai
        .expect(mockNetwork.post)
        .to.have.been.calledWith(
          'some_base_url/api/v1/safes/some_safe_address/multisig-transactions/estimations/',
          safeTx
        )
    })

    it('should return estimate', async () => {
      const mockNetwork: any = {
        post: sinon.fake.returns({ data: { safeTxGas: 424242 } })
      }
      const service = new SafeService('some_base_url', mockNetwork)
      const safeTx = {
        to: 'to_address',
        value: 'some_value',
        data: 'some_data'
      }

      await chai
        .expect(service.estimateSafeTx('some_safe_address', safeTx))
        .to.be.eventually.deep.equals(BigNumber.from(424242))
      chai
        .expect(mockNetwork.post)
        .to.have.been.calledWith(
          'some_base_url/api/v1/safes/some_safe_address/multisig-transactions/estimations/',
          safeTx
        )
    })
  })

  describe('getSafeTxDetails', async () => {
    it('should throw an error', async () => {
      const mockNetwork: any = {
        get: sinon.fake.throws(new Error('Test error'))
      }
      const service = new SafeService('some_base_url', mockNetwork)

      await chai
        .expect(service.getSafeTxDetails('some_safe_tx_hash'))
        .to.be.rejectedWith('Test error')
      chai
        .expect(mockNetwork.get)
        .to.have.been.calledWith('some_base_url/api/v1/multisig-transactions/some_safe_tx_hash')
    })

    it('should return details', async () => {
      const mockNetwork: any = {
        get: sinon.fake.returns({ data: 'this needs to be replace with proper data' })
      }
      const service = new SafeService('some_base_url', mockNetwork)

      await chai
        .expect(service.getSafeTxDetails('some_safe_tx_hash'))
        .to.be.eventually.deep.equals('this needs to be replace with proper data')
      chai
        .expect(mockNetwork.get)
        .to.have.been.calledWith('some_base_url/api/v1/multisig-transactions/some_safe_tx_hash')
    })
  })

  describe('proposeTx', async () => {
    it('should throw an error', async () => {
      const mockNetwork: any = {
        post: sinon.fake.throws(new Error('Test error'))
      }
      const service = new SafeService('some_base_url', mockNetwork)
      const safeTx = new SafeTransaction({
        to: 'to_address',
        value: 'some_value',
        data: 'some_data',
        operation: OperationType.Call,
        safeTxGas: 123,
        baseGas: 0,
        gasPrice: 0,
        gasToken: 'some_gas_token',
        refundReceiver: 'some_gas_token',
        nonce: 42
      })
      const signature: any = {
        signer: 'some_signer',
        data: 'signature_data'
      }

      await chai
        .expect(service.proposeTx('some_safe_address', 'some_safe_tx_hash', safeTx, signature))
        .to.be.rejectedWith('Test error')
      chai
        .expect(mockNetwork.post)
        .to.have.been.calledWith(
          'some_base_url/api/v1/safes/some_safe_address/multisig-transactions/',
          {
            ...safeTx.data,
            contractTransactionHash: 'some_safe_tx_hash',
            sender: 'some_signer',
            signature: 'signature_data'
          }
        )
    })

    it('should return tx hash', async () => {
      const mockNetwork: any = {
        post: sinon.fake.returns({ data: 'some_tx_hash' })
      }
      const service = new SafeService('some_base_url', mockNetwork)
      const safeTx = new SafeTransaction({
        to: 'to_address',
        value: 'some_value',
        data: 'some_data',
        operation: OperationType.Call,
        safeTxGas: 123,
        baseGas: 0,
        gasPrice: 0,
        gasToken: 'some_gas_token',
        refundReceiver: 'some_gas_token',
        nonce: 42
      })
      const signature: any = {
        signer: 'some_signer',
        data: 'signature_data'
      }

      await chai
        .expect(service.proposeTx('some_safe_address', 'some_safe_tx_hash', safeTx, signature))
        .to.be.eventually.equals('some_tx_hash')
      chai
        .expect(mockNetwork.post)
        .to.have.been.calledWith(
          'some_base_url/api/v1/safes/some_safe_address/multisig-transactions/',
          {
            ...safeTx.data,
            contractTransactionHash: 'some_safe_tx_hash',
            sender: 'some_signer',
            signature: 'signature_data'
          }
        )
    })
  })
})
