import { SESSION_COOKIE } from '../../../lib/cosmosAuth.js'

export async function POST() {
  const response = Response.json({ success: true })
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
