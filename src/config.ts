import { config } from 'dotenv'
config()

export const SOCKET_LISTEN = 3000

export const INTERNAL_API_URL = process.env.INTERNAL_API
