export enum HttpMethod {
  Get = 'get',
  Post = 'post',
  Delete = 'delete'
}

export interface HttpRequest {
  url: string
  method: HttpMethod
  body?: any
}

export class HttpError extends Error {
  statusCode: number
  data: unknown

  constructor(statusCode: number, message: string, data: unknown) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.data = data
  }
}

export async function sendRequest<T>(
  { url, method, body }: HttpRequest,
  apiKey?: string
): Promise<T> {
  const fetch = await (typeof window === 'undefined'
    ? import('node-fetch').then((m) => m.default)
    : Promise.resolve(window.fetch))

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(body)
  })

  const text = await response.text()

  if (!response.ok) {
    let jsonResponse: any
    try {
      jsonResponse = JSON.parse(text)
    } catch {
      throw new HttpError(response.status, response.statusText, undefined)
    }
    if (jsonResponse.data) {
      throw new HttpError(response.status, jsonResponse.data, jsonResponse)
    }
    if (jsonResponse.detail) {
      throw new HttpError(response.status, jsonResponse.detail, jsonResponse)
    }
    if (jsonResponse.message) {
      throw new HttpError(response.status, jsonResponse.message, jsonResponse)
    }
    if (jsonResponse.nonFieldErrors) {
      throw new HttpError(response.status, jsonResponse.nonFieldErrors, jsonResponse)
    }
    if (jsonResponse.delegate) {
      throw new HttpError(response.status, jsonResponse.delegate, jsonResponse)
    }
    if (jsonResponse.safe) {
      throw new HttpError(response.status, jsonResponse.safe, jsonResponse)
    }
    if (jsonResponse.delegator) {
      throw new HttpError(response.status, jsonResponse.delegator, jsonResponse)
    }
    throw new HttpError(response.status, response.statusText, jsonResponse)
  }

  if (!text) {
    return undefined as unknown as T
  }

  return JSON.parse(text) as T
}
