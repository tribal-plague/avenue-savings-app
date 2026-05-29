import { cookies } from 'next/headers'
import { errorResponse, SESSION_COOKIE, verifySession } from '../../lib/cosmosAuth.js'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value || '')
    return Response.json({ authenticated: Boolean(session), user: session || null })
  } catch (error) {
    return errorResponse(error)
  }
}
