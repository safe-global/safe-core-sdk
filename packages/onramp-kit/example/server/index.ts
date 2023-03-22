import dotenv from 'dotenv'

import Server from './src/server'
import routes from './src/router/router'

dotenv.config()

const { SERVER_PORT, FRONTEND_ORGIN } = process.env

const allowedOrigins = FRONTEND_ORGIN?.split(',')

const DEFAULT_SERVER_PORT = '3001'

const server = new Server()

server.configureCors(allowedOrigins)

server.registerRoutes(routes)

server.start(SERVER_PORT || DEFAULT_SERVER_PORT)
