import { OrderState } from '@monerium/sdk'
import { MoneriumNotification, MoneriumWebSocketOptions } from './types'

export const connectToOrderNotifications = ({
  profile,
  accessToken,
  env,
  subscriptions
}: MoneriumWebSocketOptions): WebSocket => {
  const baseUrl = env === 'production' ? 'wss://api.monerium.app' : 'wss://api.monerium.dev'
  const socketUrl = `${baseUrl}/profiles/${profile}/orders?access_token=${accessToken}`

  const socket = new WebSocket(socketUrl)

  socket.addEventListener('open', () => {
    console.info(`Socket connected: ${socketUrl}`)
  })

  socket.addEventListener('error', (event) => {
    console.error(event)
    throw new Error(`Socket error: ${socketUrl}`)
  })

  socket.addEventListener('message', (event) => {
    const notification = JSON.parse(event.data) as MoneriumNotification

    subscriptions.get(notification.meta.state as OrderState)?.(notification)
  })

  socket.addEventListener('close', () => {
    console.info(`Socket connection closed: ${socketUrl}`)
  })

  return socket
}
