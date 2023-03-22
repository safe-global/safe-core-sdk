import { StripeDefaultOpenOptions, StripeSession } from './types'

export const createSession = async (
  baseUrl: string,
  defaultOptions: StripeDefaultOpenOptions
): Promise<StripeSession> => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/onramp/stripe/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(defaultOptions)
    })

    if (!response.ok) throw new Error("Couldn't create a new Stripe session")

    return response.json()
  } catch (e) {
    throw new Error(e as string)
  }
}

export const getSession = async (baseUrl: string, sessionId: string) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/onramp/stripe/session/${sessionId}`)

    if (!response.ok) throw new Error(`Couldn't get the session with id  ${sessionId}`)

    return response.json()
  } catch (e) {
    throw new Error(e as string)
  }
}
