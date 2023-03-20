import express from 'express'

import stripeController from '../controllers/stripe-controller'

const STRIPE_CREATE_SESSION_PATHNAME = '/api/v1/onramp/stripe/session'
const STRIPE_GET_SESSION_PATHNAME = '/api/v1/onramp/stripe/session/:sessionId'

const stripeRouter = express.Router()

stripeRouter.post(STRIPE_CREATE_SESSION_PATHNAME, stripeController.getStripeClientSecret)
stripeRouter.get(STRIPE_GET_SESSION_PATHNAME, stripeController.getStripeSession)

export default stripeRouter
