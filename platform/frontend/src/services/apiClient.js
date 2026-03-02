/**
 * API configuration and base client for MeshLogIQ backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.meshlogiq.local'

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
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(status, data, response) {
    const message = typeof data === 'object' && data.detail 
      ? data.detail 
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