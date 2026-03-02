/**
 * Device API service
 */
import { apiClient, createAuthHeaders } from './apiClient'

export class DeviceService {
  async listDevices(token, orgSlug) {
    try {
      const headers = {
        ...createAuthHeaders(token),
        'X-Organization': orgSlug,
      }
      const data = await apiClient.request('/api/devices/', {
        method: 'GET',
        headers,
      })
      return { success: true, data, error: null }
    } catch (error) {
      console.error('Devices fetch failed:', error)
      return { success: false, data: null, error: error.message }
    }
  }

  async createDevice(token, orgSlug, payload) {
    try {
      const headers = {
        ...createAuthHeaders(token),
        'X-Organization': orgSlug,
      }
      const data = await apiClient.request('/api/devices/', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      return { success: true, data, error: null }
    } catch (error) {
      console.error('Device create failed:', error)
      return { success: false, data: null, error: error.message }
    }
  }
}

export const deviceService = new DeviceService()
export default deviceService
