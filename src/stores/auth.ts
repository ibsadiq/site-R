import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from '@/utils/axiosInstance'

const URI_LOGIN = '/auth/login/'
const URI_LOGOUT = '/auth/logout/'
const URI_USER_INFO = '/users/me/'
const URI_TOKEN_VERIFY = '/auth/token/verify/'
const URI_TOKEN_REFRESH = '/auth/token/refresh/'

interface User {
  id: number;
  email: string;
  name: string;
  groups: Array<string>;
  sites: Array<string>;
  is_active: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
  user?: User; // Optional in case some backends include it
}

export const useAuthStore = defineStore('auth', () => {
  // State - Initialize from localStorage
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  
  // Initialize user from localStorage with proper error handling
  const getUserFromStorage = (): User | null => {
    try {
      const storedUser = localStorage.getItem('user')
      return storedUser ? JSON.parse(storedUser) : null
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
      localStorage.removeItem('user') // Clear corrupted data
      return null
    }
  }
  
  const user = ref<User | null>(getUserFromStorage())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => {
    return !!(accessToken.value && refreshToken.value)
  })
  
  const isAdmin = computed(() => user.value?.groups?.includes('Admin') || false)
  
  const userInitials = computed(() => {
    if (!user.value?.name) return ''
    
    return user.value.name
      .trim()
      .split(' ')
      .filter(word => word.length > 0) // Filter out empty strings
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) // Limit to 2 characters max
  })

  // Helper function to update localStorage
  const updateTokensInStorage = (access: string | null, refresh: string | null) => {
    if (access) {
      localStorage.setItem('accessToken', access)
    } else {
      localStorage.removeItem('accessToken')
    }
    
    if (refresh) {
      localStorage.setItem('refreshToken', refresh)
    } else {
      localStorage.removeItem('refreshToken')
    }
  }

  const updateUserInStorage = (userData: User | null) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
  }

  const clearTokens = () => {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    delete axiosInstance.defaults.headers.common['Authorization']
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axiosInstance.post<AuthResponse>(URI_LOGIN, credentials)
      const { access, refresh } = response.data

      // Store tokens
      accessToken.value = access
      refreshToken.value = refresh
      updateTokensInStorage(access, refresh)

      // Set default authorization header
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`

      // Fetch user info after successful login
      await fetchUserInfo()

      return { success: true }
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.response?.data?.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (refreshToken.value) {
        // Try to logout on server (blacklist the refresh token)
        await axiosInstance.post(URI_LOGOUT, {
          refresh: refreshToken.value // Changed from refresh_token to refresh
        })
      }
    } catch (err) {
      console.warn('Logout request failed:', err)
    } finally {
      clearTokens()
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
  }

  const fetchUserInfo = async () => {
    try {
      if (!accessToken.value) {
        console.warn('No access token available for fetching user info')
        return
      }

      const response = await axiosInstance.get<User>(URI_USER_INFO)
      user.value = response.data
      updateUserInStorage(response.data)
      
      console.log('User info fetched successfully:', response.data)
    } catch (err: any) {
      console.error('Failed to fetch user info:', err)
      // Let the axios interceptor handle token refresh automatically
      // Don't clear tokens here, let the interceptor decide
    }
  }

  const verifyToken = async () => {
    try {
      if (!accessToken.value) return false

      await axiosInstance.post(URI_TOKEN_VERIFY, {
        token: accessToken.value
      })
      return true
    } catch (err) {
      console.log('Token verification failed:', err)
      return false
    }
  }

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken.value) {
        console.warn('No refresh token available')
        clearTokens()
        return false
      }

      const response = await axiosInstance.post<{ access: string }>(URI_TOKEN_REFRESH, {
        refresh: refreshToken.value // Changed from refresh_token to refresh
      })

      const newAccessToken = response.data.access
      accessToken.value = newAccessToken
      updateTokensInStorage(newAccessToken, refreshToken.value)
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`

      console.log('Access token refreshed successfully')
      return true
    } catch (err) {
      console.error('Token refresh failed:', err)
      clearTokens()
      return false
    }
  }

  // Initialize authentication state on store creation
  const initializeAuth = () => {
    if (accessToken.value) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken.value}`
      console.log('Authentication initialized with existing token')
      
      // Log current state for debugging
      console.log('Current user:', user.value)
      console.log('User initials:', userInitials.value)
    }
  }

  const hasPermission = (permission: string) => {
    return user.value?.groups?.includes(permission) || false
  }

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission))
  }

  // Initialize auth on store creation
  initializeAuth()

  return {
    // State
    accessToken,
    refreshToken,
    user,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    isAdmin,
    userInitials,
    
    // Actions
    login,
    logout,
    fetchUserInfo,
    verifyToken,
    refreshAccessToken,
    hasPermission,
    hasAnyPermission,
    clearTokens,
    initializeAuth
  }
})