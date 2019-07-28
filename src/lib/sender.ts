import { ExtWebSocket } from '../types'
import logger from './logger'

const sockets = new Map<string, ExtWebSocket>()
const users = new Map<string, ExtWebSocket[]>()

export function clear() {
  sockets.clear()
  users.clear()
}

export function saveSocket(id: string, user: string, ws: ExtWebSocket) {
  sockets.set(id, ws)

  if (users.has(user)) {
    const list = users.get(user)
    list.push(ws)
    users.set(user, list)
  } else {
    users.set(user, [ws])
  }
}

export function removeSocket(id: string, user: string) {
  sockets.delete(id)
  const list = users.get(user).filter(e => e.id !== id)
  users.set(user, list)
}

export function sendToUser(user: string, payload: Object): boolean {
  if (!users.has(user)) {
    return false
  }
  const sockets = users.get(user)
  sockets.forEach(s => s.send(JSON.stringify(payload)))
  logger.info('[send:message:user]', user, payload)
  return true
}
