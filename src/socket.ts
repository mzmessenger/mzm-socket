import WebSocket from 'ws'
import request from 'request'
import { SOCKET_LISTEN, SOCKET_REQUEST_URL } from './config'
import logger from './lib/logger'
import redis from './lib/redis'

type PostData = {
  cmd: 'socket:connection'
  payload: { user: string; twitterUserName: string }
}

async function requestSocketAPI(data: Object | string, user: string) {
  const options = {
    headers: { 'Content-type': 'application/json', 'x-user-id': user },
    body: typeof data === 'string' ? data : JSON.stringify(data)
  }
  return new Promise((resolve, reject) => {
    request.post(SOCKET_REQUEST_URL, options, (err, res, body) => {
      if (err) {
        logger.error('[post]', SOCKET_REQUEST_URL, err, res, body)
        return reject(err)
      }
      logger.info(
        '[post:response]',
        SOCKET_REQUEST_URL,
        data,
        res.statusCode,
        body
      )
      resolve(body)
    })
  })
}

const users: { [key: string]: WebSocket } = {}

redis.on('connect', async () => {
  const wss = new WebSocket.Server({
    port: SOCKET_LISTEN
  })

  wss.on('connection', function connection(ws, req) {
    const user: string = req.headers['x-user-id'] as string
    if (!user) {
      ws.close()
      return
    }
    users[user] = ws
    const twitterUserName = req.headers['x-twitter-user-name'] as string

    const data: PostData = {
      cmd: 'socket:connection',
      payload: { user, twitterUserName }
    }
    requestSocketAPI(data, user)

    ws.on('message', function incoming(message) {
      if (message === 'pong') {
        return
      }
      requestSocketAPI(message, user)
    })

    ws.on('close', function close() {
      logger.info('closed:', user)
      delete users[user]
    })
  })

  setInterval(() => {
    wss.clients.forEach(ws => {
      ws.send('ping')
    })
  }, 60000)
})

type ReceiveQueue = {
  user: string
  cmd: string
}

async function read() {
  const READ_STREAM = 'stream:socket:message'
  try {
    const res = await redis.xread(
      'BLOCK',
      '500',
      'COUNT',
      '1',
      'STREAMS',
      READ_STREAM,
      '$'
    )
    if (res) {
      for (const [key, val] of res) {
        for (const [id, messages] of val) {
          try {
            const receive = JSON.parse(messages[1]) as ReceiveQueue
            if (receive.user && !users[receive.user]) {
              return
            }
            users[receive.user].send(JSON.stringify(receive))
            logger.info('[send:message]', id, receive)
            await redis.xdel(READ_STREAM, id)
          } catch (e) {
            logger.error('parse error', e, id, messages)
          }
        }
      }
    }
  } catch (e) {
    logger.error('[read]', 'stream:socket:message', e)
  }
  read()
}
read()
