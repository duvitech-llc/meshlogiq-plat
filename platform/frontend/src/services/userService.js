/**
 * User/Profile API service
 */
import { apiClient, createAuthHeaders } from './apiClient'

export class UserService {
  /**
   * Get current user profile (whoami)
   * This will trigger profile creation on first login
   */
  async getProfile(token) {
    try {
      const profile = await apiClient.get('/api/accounts/whoami/', token)
      return {
        success: true,
        data: profile,
        error: null
      }
    } catch (error) {
      console.error('Profile fetch failed:', error)
      return {
        success: false,
        data: null,
        error: error.message
      }
    }
  }

  /**
   * Get global permissions for debugging
   */
  async getGlobalPermissions(token) {
    try {
      const permissions = await apiClient.get('/api/accounts/global-permissions/', token)
      return {
        success: true,
        data: permissions,
        error: null
      }
    } catch (error) {
      console.error('Permissions fetch failed:', error)
      return {
        success: false,
        data: null,
        error: error.message
      }
    }
  }

  /**
   * Debug JWT token contents
   */
  async debugToken(token) {
    try {
      const debug = await apiClient.get('/api/accounts/debug-token/', token)
      return {
        success: true,
        data: debug,
        error: null
      }
    } catch (error) {
      console.error('Token debug failed:', error)
      return {
        success: false,
        data: null,
        error: error.message
      }
    }
  }

  /**
   * Accept an organization invite
   */
  async acceptInvite(token, inviteToken) {
    try {
      const result = await apiClient.post('/api/accounts/invite/accept/', 
        { token: inviteToken }, 
        token
      )
      return {
        success: true,
        data: result,
        error: null
      }
    } catch (error) {
      console.error('Invite accept failed:', error)
      return {
        success: false,
        data: null,
        error: error.message
      }
    }
  }

  /**
   * Create an invite for an organization
   */
  async createInvite(token, orgSlug, payload) {
    try {
      const headers = {
        ...createAuthHeaders(token),
        'X-Organization': orgSlug,
      }
      const result = await apiClient.request('/api/accounts/invite/create/', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      return { success: true, data: result, error: null }
    } catch (error) {
      console.error('Invite create failed:', error)
      return { success: false, data: null, error: error.message }
    }
  }

  /**
   * List organization members
   */
  async listOrganizationMembers(token, orgUuid) {
    try {
      const members = await apiClient.get(`/api/accounts/organizations/${orgUuid}/members/`, token)
      return { success: true, data: members, error: null }
    } catch (error) {
      console.error('Members fetch failed:', error)
      return { success: false, data: null, error: error.message }
    }
  }

  /**
   * Request a role change for a member (admins request, owners apply)
   */
  async requestMemberRole(token, orgUuid, membershipId, role) {
    try {
      const result = await apiClient.post(
        `/api/accounts/organizations/${orgUuid}/request-member-role/`,
        { membership_id: membershipId, role },
        token
      )
      return { success: true, data: result, error: null }
    } catch (error) {
      console.error('Role request failed:', error)
      return { success: false, data: null, error: error.message }
    }
  }

  /**
   * Approve a pending role request (owner only)
   */
  async approveMemberRole(token, orgUuid, membershipId, role = null) {
    try {
      const payload = role ? { membership_id: membershipId, role } : { membership_id: membershipId }
      const result = await apiClient.post(
        `/api/accounts/organizations/${orgUuid}/approve-member-role/`,
        payload,
        token
      )
      return { success: true, data: result, error: null }
    } catch (error) {
      console.error('Role approval failed:', error)
      return { success: false, data: null, error: error.message }
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(token, profileUuid, payload) {
    try {
      const result = await apiClient.request(`/api/accounts/profiles/${profileUuid}/`, {
        method: 'PATCH',
        headers: createAuthHeaders(token),
        body: JSON.stringify(payload),
      })
      return { success: true, data: result, error: null }
    } catch (error) {
      console.error('Profile update failed:', error)
      return { success: false, data: null, error: error.message }
    }
  }

  /**
   * Fetch organization details
   */
  async getOrganization(token, orgUuid) {
    try {
      const result = await apiClient.get(`/api/accounts/organizations/${orgUuid}/`, token)
      return { success: true, data: result, error: null }
    } catch (error) {
      console.error('Organization fetch failed:', error)
      return { success: false, data: null, error: error.message }
    }
  }

  /**
   * Update organization details
   */
  async updateOrganization(token, orgUuid, payload) {
    try {
      const result = await apiClient.request(`/api/accounts/organizations/${orgUuid}/`, {
        method: 'PATCH',
        headers: createAuthHeaders(token),
        body: JSON.stringify(payload),
      })
      return { success: true, data: result, error: null }
    } catch (error) {
      console.error('Organization update failed:', error)
      return { success: false, data: null, error: error.message }
    }
  }
}

// Export default instance
export const userService = new UserService()
export default userService