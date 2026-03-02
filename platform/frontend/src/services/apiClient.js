/**
 * API configuration and base client for MeshLogIQ backend
 */

const AUTH_GATEWAY_URL = import.meta.env.VITE_AUTH_GATEWAY || 'http://localhost:8000'
const API_BASE_URL = import.meta.env.VITE_API_BASE || AUTH_GATEWAY_URL

/**
 * Get the current access token from Keycloak
 */
export const getAccessToken = () => {
  // Check if Keycloak is configured and available
  const keycloakConfigured = import.meta.env.VITE_KEYCLOAK_URL && 
                             import.meta.env.VITE_KEYCLOAK_REALM && 
                             import.meta.env.VITE_KEYCLOAK_CLIENT_ID
  if (!keycloakConfigured) {
    return null
  }
  
  // Try to get token from window object (set by initKeycloak.js)
  if (window.keycloak && window.keycloak.token) {
    return window.keycloak.token
  }
  
  return null
}

/**
 * Create HTTP headers with authentication
 */
export const createAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
})

/**
 * Base API client with error handling
 */
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
    this.authGatewayURL = AUTH_GATEWAY_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')
      
      const data = isJson ? await response.json() : await response.text()
      
      if (!response.ok) {
        throw new ApiError(response.status, data, response)
      }
      
      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // Network or other errors
      throw new ApiError(0, { detail: error.message }, null)
    }
  }

  async get(endpoint, token = null) {
    const headers = token ? createAuthHeaders(token) : {}
    return this.request(endpoint, { method: 'GET', headers })
  }

  async post(endpoint, data, token = null) {
    const headers = token ? createAuthHeaders(token) : {}
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
  }

  async put(endpoint, data, token = null) {
    const headers = token ? createAuthHeaders(token) : {}
    return this.request(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint, token = null) {
    const headers = token ? createAuthHeaders(token) : {}
    return this.request(endpoint, { method: 'DELETE', headers })
  }

  /**
   * Login user via the auth gateway
   */
  async login(username, password) {
    const response = await fetch(`${this.authGatewayURL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(response.status, error, response)
    }

    return await response.json()
  }

  /**
   * Logout user via the auth gateway
   */
  async logout(refreshToken) {
    const token = getAccessToken()
    const headers = token ? createAuthHeaders(token) : {}
    
    const response = await fetch(`${this.authGatewayURL}/api/auth/logout/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(response.status, error, response)
    }

    return await response.json()
  }

  /**
   * Register new user
   */
  async register(email, username, password, firstName = '', lastName = '') {
    const response = await fetch(`${this.authGatewayURL}/api/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, username, password, first_name: firstName, last_name: lastName }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(response.status, error, response)
    }

    return await response.json()
  }

  /**
   * Get current user info
   */
  async getCurrentUser(token) {
    const headers = token ? createAuthHeaders(token) : {}
    const response = await fetch(`${this.authGatewayURL}/api/auth/me/`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(response.status, error, response)
    }

    return await response.json()
  }
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(status, data, response) {
    const message = typeof data === 'object' && (data.detail || data.error)
      ? (data.detail || data.error)
      : typeof data === 'string'
        ? data
        : 'An error occurred'
    
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.response = response
  }

  get isNetworkError() {
    return this.status === 0
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403
  }

  get isServerError() {
    return this.status >= 500
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500
  }
}

// Export default instance
export const apiClient = new ApiClient()
export default apiClient