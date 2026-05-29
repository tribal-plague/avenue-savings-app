import { authenticateUser, errorResponse, issueSession, sessionCookieOptions, SESSION_COOKIE } from '../../../lib/cosmosAuth.js'

export async function POST(request) {
  try {
    const user = await authenticateUser(await request.json())
    if (!user) {
      return Response.json({ success: false, message: 'Incorrect email or password. Please try again.' }, { status: 401 })
    }
    const response = Response.json({ success: true, user })
    response.cookies.set(SESSION_COOKIE, await issueSession(user), sessionCookieOptions())
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
