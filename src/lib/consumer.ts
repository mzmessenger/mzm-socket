import redis from './redis'
import logger from './logger'
import { sendToUser, sendToSocket } from './sender'

type ReceiveQueue = {
  user?: string
  socket?: string
  cmd: string
}

export async function consume() {
  const READ_STREAM = 'stream:socket:message'
  try {
    const res = await redis.xread(
      'BLOCK',
      '500',
      'COUNT',
      '1',
      'STREAMS',
      READ_STREAM,
      '0'
    )
    if (res) {
      for (const [, val] of res) {
        for (const [id, messages] of val) {
          try {
            const queue = JSON.parse(messages[1]) as ReceiveQueue
            if (queue.user) {
              sendToUser(queue.user, queue)
              await redis.xdel(READ_STREAM, id)
            } else if (queue.socket) {
              sendToSocket(queue.socket, queue)
              await redis.xdel(READ_STREAM, id)
            }
          } catch (e) {
            logger.error('parse error', e, id, messages)
          }
        }
      }
    }
  } catch (e) {
    logger.error('[read]', 'stream:socket:message', e)
  }
  consume()
}
