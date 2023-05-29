import { getErrorMessage } from './errors'

describe('errors', () => {
  describe('getErrorMessage()', () => {
    it('should return the message if it is an Error object with a message', () => {
      expect(getErrorMessage(new Error('error message'))).toBe('error message')
    })

    it('should return the message if it is an error with a message', () => {
      expect(getErrorMessage({ message: 'object with error message' })).toBe(
        'object with error message'
      )
    })

    it('should return the stringified error if it is any object', () => {
      expect(getErrorMessage({ anError: 'object with error message' })).toBe(
        '{"anError":"object with error message"}'
      )
    })

    it('should return an Error if it is a string', () => {
      expect(getErrorMessage('error message')).toBe('"error message"')
    })
  })
})
