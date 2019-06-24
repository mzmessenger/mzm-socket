import WebSocket from 'ws'
import uuid from 'uuid/v4'
import { SOCKET_LISTEN } from './config'
import logger from './lib/logger'
import redis from './lib/redis'
import { requestSocketAPI } from './lib/req'
import { saveSocket, removeSocket } from './lib/sender'
import { consume } from './lib/consumer'
import { ExtWebSocket } from './types'

type PostData = {
  cmd: 'socket:connection'
  payload: { user: string; twitterUserName: string }
}

redis.on('connect', async () => {
  const wss = new WebSocket.Server({
    port: SOCKET_LISTEN
  })

  consume()

  wss.on('connection', async function connection(ws: ExtWebSocket, req) {
    const user: string = req.headers['x-user-id'] as string
    if (!user) {
      ws.close()
      return
    }
    const id = uuid()
    ws.id = id
    saveSocket(id, user, ws)
    const twitterUserName = req.headers['x-twitter-user-name'] as string

    const data: PostData = {
      cmd: 'socket:connection',
      payload: { user, twitterUserName }
    }
    requestSocketAPI(data, user, id).catch(e => {
      logger.error('[post:error]', e)
    })

    ws.on('message', async function incoming(message) {
      if (message === 'pong') {
        return
      }
      try {
        await requestSocketAPI(message, user, id)
      } catch (e) {
        logger.error('[post:error]', e)
      }
    })

    ws.on('close', function close() {
      logger.info('closed:', user, ws.id)
      removeSocket(ws.id, user)
    })
  })

  setInterval(() => {
    wss.clients.forEach(ws => {
      ws.send('ping')
    })
  }, 50000)
})
