import redis from './redis'
import logger from './logger'
import { sendToUser, sendToSocket } from './sender'

type ReceiveQueue = {
  user?: string
  socket?: string
  cmd: string
}

const READ_STREAM = 'stream:socket:message'

export async function parser(read) {
  if (!read) {
    return
  }

  for (const [, val] of read) {
    for (const [id, messages] of val) {
      try {
        const queue = JSON.parse(messages[1]) as ReceiveQueue

        if (queue.user) {
          const sentFlg = sendToUser(queue.user, queue)
          if (sentFlg) {
            await redis.xdel(READ_STREAM, id)
          }
        } else if (queue.socket) {
          const sentFlg = sendToSocket(queue.socket, queue)
          if (sentFlg) {
            await redis.xdel(READ_STREAM, id)
          }
        }
      } catch (e) {
        logger.error('parse error', e, id, messages)
      }
    }
  }
}

export async function consume() {
  try {
    const res = await redis.xread('COUNT', '1', 'STREAMS', READ_STREAM, '0')
    await parser(res)
  } catch (e) {
    logger.error('[read]', 'stream:socket:message', e)
  }
  await consume()
}
