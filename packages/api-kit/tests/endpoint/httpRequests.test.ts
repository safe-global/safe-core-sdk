import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { HttpError, HttpMethod, sendRequest } from '@safe-global/api-kit/utils/httpRequests'

chai.use(chaiAsPromised)
const { expect } = chai

const STATUS_TEXTS: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  404: 'Not Found',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
}

function mockResponse(status: number, body: string | object): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: STATUS_TEXTS[status] ?? 'Unknown',
    text: () => Promise.resolve(text)
  } as unknown as Response
}

describe('sendRequest', () => {
  let fetchStub: sinon.SinonStub
  let originalWindow: unknown

  const request = { url: 'https://example.com/api', method: HttpMethod.Get }

  beforeEach(() => {
    originalWindow = (globalThis as any).window
    fetchStub = sinon.stub()
    ;(globalThis as any).window = { fetch: fetchStub }
  })

  afterEach(() => {
    ;(globalThis as any).window = originalWindow
  })

  describe('successful responses', () => {
    it('returns parsed JSON body', async () => {
      fetchStub.resolves(mockResponse(200, { safe: '0x123' }))
      const result = await sendRequest(request)
      expect(result).to.deep.equal({ safe: '0x123' })
    })

    it('returns undefined for an empty body (204 No Content)', async () => {
      fetchStub.resolves(mockResponse(204, ''))
      const result = await sendRequest(request)
      expect(result).to.be.undefined
    })

    it('sets Authorization header when apiKey is provided', async () => {
      fetchStub.resolves(mockResponse(200, {}))
      await sendRequest(request, 'my-api-key')
      const [, options] = fetchStub.firstCall.args
      expect(options.headers['Authorization']).to.equal('Bearer my-api-key')
    })

    it('does not set Authorization header when no apiKey is provided', async () => {
      fetchStub.resolves(mockResponse(200, {}))
      await sendRequest(request)
      const [, options] = fetchStub.firstCall.args
      expect(options.headers).not.to.have.property('Authorization')
    })
  })

  describe('error responses', () => {
    it('throws HttpError for a 429 with detail field', async () => {
      fetchStub.resolves(mockResponse(429, { detail: 'Monthly quota exceeded.' }))
      const err = await sendRequest(request).catch((e) => e)
      expect(err).to.be.instanceOf(HttpError)
      expect(err.statusCode).to.equal(429)
      expect(err.message).to.equal('Monthly quota exceeded.')
    })

    it('throws HttpError for a 422 with CodeErrorResponse message field', async () => {
      fetchStub.resolves(
        mockResponse(422, { code: 1, message: 'Owner address checksum not valid', arguments: [] })
      )
      const err = await sendRequest(request).catch((e) => e)
      expect(err).to.be.instanceOf(HttpError)
      expect(err.statusCode).to.equal(422)
      expect(err.message).to.equal('Owner address checksum not valid')
    })

    it('preserves the full response body in HttpError.data', async () => {
      const body = { code: 1, message: 'Owner address checksum not valid', arguments: ['0xabc'] }
      fetchStub.resolves(mockResponse(422, body))
      const err = await sendRequest(request).catch((e) => e)
      expect(err.data).to.deep.equal(body)
    })

    it('falls back to statusText when error body is not JSON', async () => {
      fetchStub.resolves({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: () => Promise.resolve('<html>Service Unavailable</html>')
      })
      const err = await sendRequest(request).catch((e) => e)
      expect(err).to.be.instanceOf(HttpError)
      expect(err.statusCode).to.equal(503)
      expect(err.message).to.equal('Service Unavailable')
    })

    it('falls back to statusText when error body has no known field', async () => {
      fetchStub.resolves(mockResponse(400, { unknown: 'field' }))
      const err = await sendRequest(request).catch((e) => e)
      expect(err).to.be.instanceOf(HttpError)
      expect(err.statusCode).to.equal(400)
      expect(err.message).to.equal('Bad Request')
    })

    it('falls back to statusText for empty error body', async () => {
      fetchStub.resolves(mockResponse(404, ''))
      const err = await sendRequest(request).catch((e) => e)
      expect(err).to.be.instanceOf(HttpError)
      expect(err.statusCode).to.equal(404)
      expect(err.message).to.equal('Not Found')
    })

    it('is an instance of Error for backwards compatibility', async () => {
      fetchStub.resolves(mockResponse(429, { detail: 'Rate limited' }))
      const err = await sendRequest(request).catch((e) => e)
      expect(err).to.be.instanceOf(Error)
    })
  })
})
