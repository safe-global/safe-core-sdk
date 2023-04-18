import dotenv from 'dotenv'

import Server from './src/server'
import routes from './src/router/router'

dotenv.config()

const { SERVER_PORT, FRONTEND_ORIGIN } = process.env

const allowedOrigins = FRONTEND_ORIGIN?.split(',')

const DEFAULT_SERVER_PORT = '3001'

const server = new Server()

server.configureCors(allowedOrigins)

server.registerRoutes(routes)

server.start(SERVER_PORT || DEFAULT_SERVER_PORT)
