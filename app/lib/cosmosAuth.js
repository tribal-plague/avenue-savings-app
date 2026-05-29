import { CosmosClient } from '@azure/cosmos'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'avenue_session'
const SESSION_SECONDS = 60 * 60 * 24

function clean(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '')
}

function readEnv(names, fallback = '') {
  for (const name of Array.isArray(names) ? names : [names]) {
    const value = clean(process.env[name])
    if (value) return value
  }
  return fallback
}

function getConfig() {
  return {
    endpoint: readEnv(['VOS_COSMOS_ENDPOINT', 'MR_COSMOS_ENDPOINT']),
    key: readEnv(['VOS_COSMOS_KEY', 'MR_COSMOS_KEY']),
    database: readEnv(['VOS_COSMOS_DATABASE', 'MR_COSMOS_DATABASE'], 'memory-router'),
    usersContainer: readEnv(['VOS_COSMOS_USERS_CONTAINER', 'MR_COSMOS_USERS_CONTAINER'], 'memory_router_users'),
    jwtSecret: readEnv(['AVENUE_JWT_SECRET', 'VOS_JWT_SECRET', 'JWT_SECRET', 'MR_JWT_SECRET']),
  }
}

function requireConfig() {
  const config = getConfig()
  const missing = []
  if (!config.endpoint) missing.push('MR_COSMOS_ENDPOINT')
  if (!config.key) missing.push('MR_COSMOS_KEY')
  if (!config.database) missing.push('MR_COSMOS_DATABASE')
  if (!config.usersContainer) missing.push('MR_COSMOS_USERS_CONTAINER')
  if (!config.jwtSecret) missing.push('MR_JWT_SECRET')
  if (missing.length) {
    throw new Error(`Missing Avenue auth configuration: ${missing.join(', ')}`)
  }
  return config
}

let cosmosClient = null

function getUsersContainer() {
  const config = requireConfig()
  if (!cosmosClient) {
    cosmosClient = new CosmosClient({ endpoint: config.endpoint, key: config.key })
  }
  return cosmosClient.database(config.database).container(config.usersContainer)
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function publicUser(user) {
  const email = normalizeEmail(user.email)
  return {
    id: email,
    email,
    name: String(user.display_name || user.displayName || email).trim(),
    role: String(user.role || 'avenue_user'),
  }
}

export async function findUserByEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  const { resources } = await getUsersContainer().items.query({
    query: 'SELECT * FROM c WHERE c.email = @email',
    parameters: [{ name: '@email', value: normalized }],
  }).fetchAll()
  return resources?.[0] || null
}

export async function createUser({ name, email, password }) {
  const normalized = normalizeEmail(email)
  if (!name || !normalized || !password) {
    const error = new Error('Name, email, and password are required.')
    error.status = 400
    throw error
  }
  if (String(password).length < 8) {
    const error = new Error('Password must be at least 8 characters.')
    error.status = 400
    throw error
  }
  if (await findUserByEmail(normalized)) {
    const error = new Error('An account with this email already exists. Try signing in instead.')
    error.status = 409
    throw error
  }
  const now = new Date().toISOString()
  const doc = {
    id: normalized,
    pk: normalized,
    type: 'user',
    source: 'avenue-savings',
    email: normalized,
    password_hash: await bcrypt.hash(String(password), 12),
    role: 'avenue_user',
    display_name: String(name).trim(),
    project_ids: ['avenue-savings'],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
  const { resource } = await getUsersContainer().items.upsert(doc)
  return publicUser(resource || doc)
}

export async function authenticateUser({ email, password }) {
  const user = await findUserByEmail(email)
  if (!user?.password_hash) return null
  const matches = await bcrypt.compare(String(password || ''), String(user.password_hash))
  return matches ? publicUser(user) : null
}

function secretKey() {
  return new TextEncoder().encode(requireConfig().jwtSecret)
}

export async function issueSession(user) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySession(token) {
  if (!token) return null
  try {
    const verified = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    return verified.payload
  } catch {
    return null
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_SECONDS,
  }
}

export function errorResponse(error) {
  return Response.json({
    success: false,
    message: error instanceof Error ? error.message : String(error),
  }, { status: Number(error?.status || 500) })
}
