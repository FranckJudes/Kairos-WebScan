import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { useState } from 'react'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'

const loginSchema = z.object({
  email: z.string().min(1, 'L\'email est requis').email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
  rememberMe: z.boolean().optional()
})

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const onSubmit = async (data) => {
    try {
      setLoginError(null)
      await login(data)
      navigate(from, { replace: true })
    } catch (error) {
      setLoginError(error.message || 'Une erreur est survenue lors de la connexion')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel: Visual/Illustration (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#141414] items-center justify-center">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-600 via-[#141414] to-[#141414]"></div>
        <div className="relative z-10 w-full max-w-lg p-12">
          <div className="relative group">
            {/* Abstract 3D Geometric Illustration */}
            <div className="aspect-square w-full rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700 bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center">
              <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80')", backgroundPosition: 'center' }}></div>
              <div className="relative z-20 text-white text-center p-8">
                <span className="material-symbols-outlined text-6xl mb-6 opacity-80">deployed_code</span>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Kairos WebScan</h2>
                <p className="text-neutral-400 text-lg leading-relaxed">Sécurisez vos applications web avec notre solution de scanning avancée.</p>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </div>
        {/* Bottom Branding */}
        <div className="absolute bottom-10 left-12 flex items-center gap-2 text-white/50">
          <span className="text-xs font-medium tracking-widest uppercase">Enterprise Edition</span>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-white dark:bg-[#191919]">
        <div className="w-full max-w-[440px] space-y-8">
          {/* Header & Logo */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="size-8 bg-[#141414] dark:bg-white rounded flex items-center justify-center text-white dark:text-[#141414]">
                <svg className="size-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight dark:text-white">Kairos WebScan</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#141414] dark:text-white">Bienvenue</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Entrez vos identifiants pour accéder à votre tableau de bord.</p>
          </div>

          {/* Social Logins */}
          <div className="grid gap-4">
            <button
              type="button"
              onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/google/login`}
              className="flex items-center justify-center gap-2 h-12 px-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <img alt="Google Logo" className="size-5" src="https://www.svgrepo.com/show/475656/google-color.svg" />
              <span className="text-sm font-semibold dark:text-white">Google</span>
            </button>
            {/* <button
              type="button"
              className="flex items-center justify-center gap-2 h-12 px-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg aria-hidden="true" className="size-5 dark:fill-white" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
              <span className="text-sm font-semibold dark:text-white">GitHub</span>
            </button> */}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200 dark:border-neutral-800"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#191919] px-2 text-neutral-500 font-medium">Ou continuer avec email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#141414] dark:text-neutral-200" htmlFor="email">Adresse Email</label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  autoComplete="email"
                  className={`
                    w-full h-12 px-4 bg-[#f7f7f7] dark:bg-neutral-900 border rounded-lg focus:ring-2 focus:ring-[#141414]/10 focus:border-[#141414] outline-none transition-all dark:text-white
                    ${errors.email ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}
                  `}
                  placeholder="nom@entreprise.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#141414] dark:text-neutral-200" htmlFor="password">Mot de passe</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#141414]/70 dark:text-neutral-400 hover:text-[#141414] dark:hover:text-white transition-colors underline underline-offset-4"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  className={`
                    w-full h-12 px-4 bg-[#f7f7f7] dark:bg-neutral-900 border rounded-lg focus:ring-2 focus:ring-[#141414]/10 focus:border-[#141414] outline-none transition-all dark:text-white pr-12
                    ${errors.password ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-neutral-400 hover:text-[#141414] dark:hover:text-white"
                >
                  {showPassword ? (
                    <VisibilityOffRounded className="text-[20px]" />
                  ) : (
                    <VisibilityRounded className="text-[20px]" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {loginError}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                {...register('rememberMe')}
                type="checkbox"
                id="remember"
                className="size-4 rounded border-neutral-300 text-[#141414] focus:ring-[#141414]"
              />
              <label className="text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer" htmlFor="remember">
                Se souvenir de moi pendant 30 jours
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <span>Se connecter</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-6 text-center">
            <p className="text-sm text-neutral-500">
              Pas encore de compte ?{' '}
              <Link className="font-bold text-[#141414] dark:text-white hover:underline underline-offset-4" to="/register">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Simple Help Footer */}
        <div className="mt-auto pt-10 flex gap-6 text-xs text-neutral-400">
          <Link className="hover:text-[#141414] dark:hover:text-white transition-colors" to="#">Politique de confidentialité</Link>
          <Link className="hover:text-[#141414] dark:hover:text-white transition-colors" to="#">Conditions d'utilisation</Link>
          <Link className="hover:text-[#141414] dark:hover:text-white transition-colors" to="#">Support</Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
