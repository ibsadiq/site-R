import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from '@/utils/axiosInstance'

const URI_LOGIN = '/auth/login'
const URI_LOGOUT = '/auth/logout'
const URI_USER_INFO = '/users/me'
const URI_TOKEN_VERIFY = '/auth/token/verify'
const URI_TOKEN_REFRESH = '/auth/token/refresh'

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
  user: User;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const user = ref<User |  null>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null);
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.groups.includes('Admin') || false)
  const userInitials = computed(() => {
    if (!user.value?.name) return ''
    return user.value.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
  })


  const clearTokens = () => {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    delete axiosInstance.defaults.headers.common['Authorization']
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axiosInstance.post<AuthResponse>(URI_LOGIN, credentials)
      const { access, refresh} = response.data

      accessToken.value = access
      refreshToken.value = refresh
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`

      await fetchUserInfo()

      return { success: true }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (refreshToken.value) {
        await axiosInstance.post(URI_LOGOUT, {
          refresh_token: refreshToken.value
        })
      }
    } catch (err) {
      console.warn('Logout request failed:', err)
    } finally {
      clearTokens()
    }
  }

  const fetchUserInfo = async () => {
    try {
      if (!accessToken.value) return

      const response = await axiosInstance.get<User>(URI_USER_INFO)
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch (err: any) {
      if (err.response?.status === 401) {
        await refreshAccessToken()
      } else {
        console.error('Failed to fetch user info:', err)
      }
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
      return false
    }
  }

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken.value) {
        clearTokens()
        return false
      }

      const response = await axiosInstance.post<{ access_token: string }>(URI_TOKEN_REFRESH, {
        refresh_token: refreshToken.value
      })

      const newAccessToken = response.data.access_token
      accessToken.value = newAccessToken
      localStorage.setItem('accessToken', newAccessToken)
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`

      return true
    } catch (err) {
      clearTokens()
      return false
    }
  }


  const hasPermission = (permission: string) => {
    return user.value?.groups.includes(permission) || false
  }

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission))
  }

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
    clearTokens
  }
})