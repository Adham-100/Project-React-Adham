import { useState } from 'react'
import { AuthContext } from './storeContexts'

const SESSION_KEY = 'marketly.session'
const ACCOUNT_KEY = 'marketly.registered-account'

function readStoredValue(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

function safeUser(user) {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    image: user.image,
    role: user.role || 'user',
  }
}

async function hashPassword(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function createSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredValue(SESSION_KEY))

  function saveSession(user, tokens = {}) {
    const nextSession = {
      user: safeUser(user),
      accessToken: tokens.accessToken || null,
      refreshToken: tokens.refreshToken || null,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
  }

  async function login(username, password) {
    const account = readStoredValue(ACCOUNT_KEY)

    if (account && account.username === username) {
      const passwordHash = await hashPassword(password, account.salt)
      if (passwordHash === account.passwordHash) {
        saveSession(account.user)
        return
      }
    }

    const response = await fetch('https://dummyjson.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, expiresInMins: 30 }),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'That username and password did not match.')
    }

    let user = data
    if (data.id) {
      const profileResponse = await fetch(`https://dummyjson.com/users/${data.id}`)
      if (profileResponse.ok) {
        user = { ...data, ...(await profileResponse.json()) }
      }
    }

    saveSession(user, {
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
    })
  }

  async function register(details) {
    const salt = createSalt()
    const passwordHash = await hashPassword(details.password, salt)
    const response = await fetch('https://dummyjson.com/users/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        username: details.username,
        password: details.password,
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'We could not create your account.')
    }

    const user = safeUser({ ...data, ...details, role: 'user' })
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({
      username: details.username,
      salt,
      passwordHash,
      user,
    }))
    saveSession(user)
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user: session?.user || null, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

