import axios, { AxiosResponse } from 'axios'

export enum HttpMethod {
  Get = 'get',
  Post = 'post',
  Delete = 'delete'
}

interface HttpRequest {
  url: string
  method: HttpMethod
  body?: Object
}

export async function sendRequest<T>({ url, method, body }: HttpRequest): Promise<T> {
  let response: AxiosResponse<T>
  try {
    response = await axios[method](url, body)
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const data = error.response.data
      if (data) {
        if (data.data) {
          throw new Error(data.data)
        }
        throw new Error(data.message)
      }
      throw new Error(error.response.statusText)
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      throw new Error('Connection error')
    }
    // Something happened in setting up the request that triggered an Error
    throw new Error(error.message)
  }
  return response.data as T
}
