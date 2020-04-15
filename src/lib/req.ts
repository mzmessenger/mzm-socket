import request from 'request'
import { INTERNAL_API_URL } from '../config'
import logger from './logger'

// todo: retry
export const requestSocketAPI = async (
  data: Object | string,
  user: string,
  id: string
) => {
  const options = {
    headers: {
      'Content-type': 'application/json',
      'x-user-id': user,
      'x-socket-id': id
    },
    body: typeof data === 'string' ? data : JSON.stringify(data)
  }
  return new Promise((resolve, reject) => {
    request.post(INTERNAL_API_URL, options, (err, res, body) => {
      if (err) {
        return reject(err)
      }
      logger.info(
        '[post:response]',
        INTERNAL_API_URL,
        data,
        res.statusCode,
        body
      )
      resolve(body)
    })
  })
}
