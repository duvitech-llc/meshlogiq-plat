/**
 * Logs API service
 */
import { apiClient } from './apiClient'

const LOG_TYPES = {
  transactions: '/api/logs/transactions/',
  events: '/api/logs/events/',
  devices: '/api/logs/devices/',
  security: '/api/logs/security/',
  dataChanges: '/api/logs/data-changes/',
}

const buildQuery = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  if (!entries.length) return ''
  const searchParams = new URLSearchParams()
  entries.forEach(([key, value]) => searchParams.append(key, String(value)))
  return `?${searchParams.toString()}`
}

export class LogsService {
  async getLogs(type, token, params = {}) {
    const endpoint = LOG_TYPES[type]
    if (!endpoint) {
      return { success: false, data: null, error: `Unknown log type: ${type}` }
    }

    try {
      const query = buildQuery(params)
      const data = await apiClient.get(`${endpoint}${query}`, token)
      return { success: true, data, error: null }
    } catch (error) {
      return { success: false, data: null, error: error.message }
    }
  }
}

export const logsService = new LogsService()
export default logsService
