import { createContext, useContext, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiAuth from '../services/apiAuth'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || sessionStorage.getItem('token'))
  const queryClient = useQueryClient()

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => apiAuth.getProfile(),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const user = profile?.user
  const recentDocuments = profile?.recent_documents || []
  const license = profile?.license || null
  const isAuthenticated = !!token && !!user && !error

  const loginMutation = useMutation({
    mutationFn: ({ email, password, rememberMe = false }) => apiAuth.login(email, password, rememberMe),
    onSuccess: (data, variables) => {
      if (variables.rememberMe) {
        localStorage.setItem('token', data.access_token)
      } else {
        sessionStorage.setItem('token', data.access_token)
      }
      setToken(data.access_token)

      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
    },
  })

  const registerMutation = useMutation({
    mutationFn: (userData) => apiAuth.register(userData),
  })

  const logoutMutation = useMutation({
    mutationFn: () => apiAuth.logout(),
    onMutate: () => {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      setToken(null)

      queryClient.clear()
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (profileData) => apiAuth.updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword, confirmNewPassword }) =>
      apiAuth.changePassword(currentPassword, newPassword, confirmNewPassword),
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences) => apiAuth.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: (email) => apiAuth.forgotPassword(email),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, password, confirmPassword }) =>
      apiAuth.resetPassword(token, password, confirmPassword),
  })

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isSendingForgotPassword: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    forgotPasswordError: forgotPasswordMutation.error,
    resetPasswordError: resetPasswordMutation.error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext

