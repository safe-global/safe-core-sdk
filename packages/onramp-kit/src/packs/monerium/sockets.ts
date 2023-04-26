import { MoneriumWebSocketOptions } from './types'

export const connectToOrderNotifications = ({
  profile,
  accessToken,
  env,
  onMessage
}: MoneriumWebSocketOptions): WebSocket => {
  const baseUrl = env === 'production' ? 'wss://api.monerium.app' : 'wss://api.monerium.app'
  const socketUrl = `${baseUrl}/profile/${profile}/orders?access_token=${accessToken}`

  const socket = new WebSocket(socketUrl)

  socket.addEventListener('open', () => {
    console.info(`Connected to ${socketUrl}`)
  })

  socket.addEventListener('error', (event) => {
    console.error(event)
    throw new Error(`Websocket error: ${socketUrl}`)
  })

  socket.addEventListener('message', (event) => {
    onMessage(event.data)
  })

  socket.addEventListener('close', () => {
    console.info(`Socket connection to ${socketUrl} closed`)
  })

  return socket
}
