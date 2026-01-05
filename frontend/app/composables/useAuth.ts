import type { User, LoginCredentials, RegisterDTO } from '@@/types'

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const token = useState<string | null>('auth-token', () => null)

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await $fetch<{ user: User, token: string }>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      user.value = response.user
      token.value = response.token
      return true
    } catch (e) {
      console.error('Login failed', e)
      return false
    }
  }

  const register = async (details: RegisterDTO) => {
    try {
      const response = await $fetch<{ user: User, token: string }>('/api/auth/register', {
        method: 'POST',
        body: details
      })
      user.value = response.user
      token.value = response.token
      return true
    } catch (e) {
      console.error('Register failed', e)
      return false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    navigateTo('/auth/login')
  }

  return {
    user,
    isAuthenticated: computed(() => !!user.value),
    login,
    register,
    logout
  }
}
