import chai from 'chai'
import { padHex } from '@safe-global/api-kit/utils'

describe('padHex', () => {
  test('default', () => {
    chai
      .expect(padHex('0x1'))
      .to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000001')

    chai
      .expect(padHex('0xa4e12a45'))
      .to.be.eq('0x00000000000000000000000000000000000000000000000000000000a4e12a45')

    chai
      .expect(padHex('0x1a4e12a45'))
      .to.be.eq('0x00000000000000000000000000000000000000000000000000000001a4e12a45')

    chai
      .expect(() =>
        padHex(
          '0x1a4e12a45a21323123aaa87a897a897a898a6567a578a867a98778a667a85a875a87a6a787a65a675a6a9'
        )
      )
      .to.throw(
        `
      [SizeExceedsPaddingSizeError: Hex size (43) exceeds padding size (32).

      Version: viem@1.0.2]
    `
      )
  })

  test('args: size', () => {
    chai.expect(padHex('0x1', { size: 4 })).to.be.eq('"0x00000001"')

    chai.expect(padHex('0xa4e12a45', { size: 4 })).to.be.eq('"0xa4e12a45"')

    chai
      .expect(() => padHex('0x1a4e12a45', { size: 4 }))
      .to.throw(
        `
      [SizeExceedsPaddingSizeError: Hex size (5) exceeds padding size (4).

      Version: viem@1.0.2]
    `
      )
  })

  test('args: dir', () => {
    chai
      .expect(padHex('0x1', { dir: 'right' }))
      .to.be.eq('"0x1000000000000000000000000000000000000000000000000000000000000000"')

    chai
      .expect(padHex('0xa4e12a45', { dir: 'right' }))
      .to.be.eq('"0xa4e12a4500000000000000000000000000000000000000000000000000000000"')

    chai
      .expect(padHex('0x1a4e12a45', { dir: 'right' }))
      .to.be.eq('"0x1a4e12a450000000000000000000000000000000000000000000000000000000"')
  })
})
