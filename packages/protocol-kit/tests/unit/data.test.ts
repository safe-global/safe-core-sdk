import chai from 'chai'
import { padHex } from '@safe-global/protocol-kit/utils'

describe('padHex', () => {
  it('should pad with zeroes', () => {
    chai
      .expect(padHex('0x1'))
      .to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000001')

    chai
      .expect(padHex('0xa4e12a45'))
      .to.be.eq('0x00000000000000000000000000000000000000000000000000000000a4e12a45')

    chai
      .expect(padHex('0x1a4e12a45'))
      .to.be.eq('0x00000000000000000000000000000000000000000000000000000001a4e12a45')
  })

  it('should allow fix size', () => {
    chai.expect(padHex('0x1', { size: 4 })).to.be.eq('0x00000001')

    chai.expect(padHex('0xa4e12a45', { size: 4 })).to.be.eq('0xa4e12a45')
  })

  it('should append to the right', () => {
    chai
      .expect(padHex('0x1', { dir: 'right' }))
      .to.be.eq('0x1000000000000000000000000000000000000000000000000000000000000000')

    chai
      .expect(padHex('0xa4e12a45', { dir: 'right' }))
      .to.be.eq('0xa4e12a4500000000000000000000000000000000000000000000000000000000')

    chai
      .expect(padHex('0x1a4e12a45', { dir: 'right' }))
      .to.be.eq('0x1a4e12a450000000000000000000000000000000000000000000000000000000')
  })

  it('should throw an error if size is smaller then the hex length', () => {
    chai.expect(() => padHex('0x1a4e12a45', { size: 4 })).to.throw(`Size (9) exceeds padding size.`)

    chai
      .expect(() =>
        padHex(
          '0x1a4e12a45a21323123aaa87a897a897a898a6567a578a867a98778a667a85a875a87a6a787a65a675a6a9'
        )
      )
      .to.throw(`Size (85) exceeds padding size.`)
  })
})
