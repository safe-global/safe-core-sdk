import pinoHttp from 'pino-http'

const logger = pinoHttp({
  serializers: {
    req(req) {
      req.body = req.raw.body // log the body request
      return req
    }
  },

  // Override attribute keys for the log object
  customAttributeKeys: {
    req: 'request',
    res: 'response'
  }
})

export default logger

export const log = logger.logger
