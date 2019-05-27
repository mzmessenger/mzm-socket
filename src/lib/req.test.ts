import { INTERNAL_API_URL } from '../config'

jest.mock('./logger')

const post = jest.fn((url, options, callback) => {
  callback(null, { statusCode: 200 }, 'body')
})

jest.mock('request', () => ({ post }))

import { requestSocketAPI } from './req'

test('requestSocketAPI', async () => {
  const user = 'user-id'
  const socket = 'socket-id'

  const message = { message: 'message' }

  await requestSocketAPI(message, user, socket)

  expect(post.mock.calls.length).toBe(1)
  const [url, options] = post.mock.calls[0]
  expect(url).toStrictEqual(INTERNAL_API_URL)
  expect(options.headers['x-user-id']).toStrictEqual(user)
  expect(options.headers['x-socket-id']).toStrictEqual(socket)
  expect(options.body).toStrictEqual(JSON.stringify(message))
})
