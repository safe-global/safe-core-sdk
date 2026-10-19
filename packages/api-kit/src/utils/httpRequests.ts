export enum HttpMethod {
  Get = 'get',
  Post = 'post',
  Patch = 'patch',
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

type FieldError = { loc?: Array<string | number>; msg: string }

/**
 * Builds the error message of a failed request.
 * The Safe Queue Service returns `{ detail: string }` for rejected data and `{ detail: FieldError[] }` for malformed requests.
 */
function getErrorMessage(jsonResponse: any): string | undefined {
  const { detail, message } = jsonResponse ?? {}

  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    return detail
      .map((error: FieldError) => {
        const location = error.loc?.filter((part) => part !== 'body').join('.')
        return location ? `${location}: ${error.msg}` : error.msg
      })
      .join('; ')
  }
  if (typeof message === 'string') {
    return message
  }

  return undefined
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
