import { createUser, errorResponse, issueSession, sessionCookieOptions, SESSION_COOKIE } from '../../../lib/cosmosAuth.js'

export async function POST(request) {
  try {
    const user = await createUser(await request.json())
    const response = Response.json({ success: true, user }, { status: 201 })
    response.cookies.set(SESSION_COOKIE, await issueSession(user), sessionCookieOptions())
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
