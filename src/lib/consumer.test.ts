jest.mock('./logger')
jest.mock('./redis', () => {
  return {
    xread: jest.fn(),
    xdel: jest.fn()
  }
})

jest.mock('./sender')
import { getMockType } from '../../jest/testUtil'
import * as sender from './sender'

const sendToUser = getMockType(sender.sendToUser)
const sendToSocket = getMockType(sender.sendToSocket)

import { parser } from './consumer'

test('parser sendToUser', async () => {
  sendToUser.mockClear()

  const user = '5cc9d148139370d11b706624'
  const queue = JSON.stringify({
    cmd: 'cmd',
    user: user
  })

  const read = [
    ['stream:socket:message', [['1558972034751-0', ['message', queue]]]]
  ]

  await parser(read)

  expect(sendToUser.mock.calls.length).toBe(1)

  const [toUser, payload] = sendToUser.mock.calls[0]
  expect(toUser).toEqual(user)
  expect(JSON.stringify(payload)).toEqual(queue)
})

test('parser sendToSocket', async () => {
  sendToSocket.mockClear()

  const socket = '5cc9d148139370d11b706624'
  const queue = JSON.stringify({
    cmd: 'cmd',
    socket: socket
  })

  const read = [
    ['stream:socket:message', [['1558972034751-0', ['message', queue]]]]
  ]

  await parser(read)

  expect(sendToSocket.mock.calls.length).toBe(1)

  const [toSocket, payload] = sendToSocket.mock.calls[0]
  expect(toSocket).toEqual(socket)
  expect(JSON.stringify(payload)).toEqual(queue)
})
