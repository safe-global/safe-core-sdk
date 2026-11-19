export enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Patch = 'PATCH',
  Delete = 'DELETE'
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

type FieldError = { loc?: Array<string | number>; msg: string }

/**
 * Builds the error message of a failed request from the error payload of the service:
 * `{ detail: string | FieldError[] }` in the Queue and Decoder services, `data`, `message`,
 * `nonFieldErrors` or a field error in the Transaction Service.
 */
function getErrorMessage(jsonResponse: any): string | undefined {
  const { detail } = jsonResponse ?? {}

  if (Array.isArray(detail)) {
    return detail
      .map((error: FieldError) => {
        const location = error.loc?.filter((part) => part !== 'body').join('.')
        return location ? `${location}: ${error.msg}` : error.msg
      })
      .join('; ')
  }

  for (const key of [
    'data',
    'detail',
    'message',
    'nonFieldErrors',
    'delegate',
    'safe',
    'delegator'
  ]) {
    if (jsonResponse?.[key]) {
      return jsonResponse[key]
    }
  }

  return undefined
}

export async function sendRequest<T>(
  { url, method, body }: HttpRequest,
  apiKey?: string
): Promise<T> {
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

    throw new HttpError(
      response.status,
      getErrorMessage(jsonResponse) ?? response.statusText,
      jsonResponse
    )
  }

  if (!text) {
    return undefined as unknown as T
  }

  return JSON.parse(text) as T
}
