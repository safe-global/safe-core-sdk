import chai from 'chai'

import generateOnChainIdentifier, {
  generateHash
} from '@safe-global/protocol-kit/utils/on-chain-tracking/generateOnChainIdentifier'

describe('generateHash', () => {
  it('should truncate by bytes, not by hex characters', () => {
    // Hard-coded vectors: the last N bytes of keccak256(input), not the ASCII
    // re-encoding of the last N hex characters (see #1424).
    chai.expect(generateHash('Test e2e Project', 20)).to.equal('b239ef6cc45f806ddf9a8ae456f26a86add0878d')
    chai.expect(generateHash('protocol-kit', 3)).to.equal('bfe928')
    chai.expect(generateHash('Web', 3)).to.equal('193dea')
  })

  it('should return exactly 2 hex characters per requested byte', () => {
    chai.expect(generateHash('Test e2e Project', 20)).to.have.lengthOf(40)
    chai.expect(generateHash('Test e2e Project', 3)).to.have.lengthOf(6)
    chai.expect(generateHash('Test e2e Project', 1)).to.have.lengthOf(2)
  })
})

describe('generateOnChainIdentifier', () => {
  it('should return the v01 identifier with byte-accurate hashes', () => {
    const onChainIdentifier = generateOnChainIdentifier({
      project: 'Test e2e Project',
      platform: 'Web',
      tool: 'protocol-kit',
      toolVersion: '1.0.0'
    })

    chai
      .expect(onChainIdentifier)
      .to.equal('5afe01b239ef6cc45f806ddf9a8ae456f26a86add0878d193deabfe928b2972c')
  })

  it('should default the platform to Web', () => {
    const onChainIdentifier = generateOnChainIdentifier({
      project: 'Test e2e Project',
      tool: 'protocol-kit',
      toolVersion: '1.0.0'
    })

    chai
      .expect(onChainIdentifier)
      .to.equal('5afe01b239ef6cc45f806ddf9a8ae456f26a86add0878d193deabfe928b2972c')
  })
})
