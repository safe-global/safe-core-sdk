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
  let response: AxiosResponse<any>
  try {
    response = await axios[method](url, body)
  } catch (error) {
    if (error.response) {
      console.log(error.response)
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.data) {
        throw new Error(error.response.data.message)
      } else {
        throw new Error(error.response.statusText)
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      throw new Error('Connection error')
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message)
    }
  }
  return response.data as T
}
