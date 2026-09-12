const TOKEN_KEY = 'followapp_token'
const ROLE_KEY = 'followapp_role'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY)
}

export function setRole(role) {
  localStorage.setItem(ROLE_KEY, role)
}

export function isAuthenticated() {
  return !!getToken()
}
