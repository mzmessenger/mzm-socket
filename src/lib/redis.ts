import Redis from 'ioredis'
const redis = new Redis({
  enableOfflineQueue: true
})

export default redis
