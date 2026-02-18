import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'

const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')

const registerSchema = z.object({
  email: z.string().min(1, 'L\'email est requis').email('Email invalide'),
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter les conditions d\'utilisation' })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
})

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordSuggestions, setPasswordSuggestions] = useState([])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      acceptTerms: false
    }
  })

  const password = watch('password')

  // Calculer la force du mot de passe
  const calculatePasswordStrength = (password) => {
    let strength = 0
    const suggestions = []

    if (!password) {
      setPasswordStrength(0)
      setPasswordSuggestions([])
      return
    }

    // Longueur
    if (password.length >= 8) {
      strength += 1
    } else {
      suggestions.push('Au moins 8 caractères')
    }

    // Minuscule
    if (/[a-z]/.test(password)) {
      strength += 1
    } else {
      suggestions.push('Au moins une minuscule')
    }

    // Majuscule
    if (/[A-Z]/.test(password)) {
      strength += 1
    } else {
      suggestions.push('Au moins une majuscule')
    }

    // Chiffre
    if (/[0-9]/.test(password)) {
      strength += 1
    } else {
      suggestions.push('Au moins un chiffre')
    }

    // Caractère spécial
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      strength += 1
    } else {
      suggestions.push('Au moins un caractère spécial')
    }

    setPasswordStrength(strength)
    setPasswordSuggestions(suggestions)
  }

  const handlePasswordChange = (e) => {
    calculatePasswordStrength(e.target.value)
  }

  const getStrengthColor = (strength) => {
    if (strength <= 1) return 'bg-red-500'
    if (strength <= 2) return 'bg-orange-500'
    if (strength <= 3) return 'bg-yellow-500'
    if (strength <= 4) return 'bg-green-400'
    return 'bg-green-600'
  }

  const getStrengthLabel = (strength) => {
    if (strength <= 1) return 'Très faible'
    if (strength <= 2) return 'Faible'
    if (strength <= 3) return 'Moyen'
    if (strength <= 4) return 'Fort'
    return 'Très fort'
  }

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registerError, setRegisterError] = useState(null)

  const onSubmit = async (data) => {
    try {
      setRegisterError(null)
      await registerUser(data)
      navigate('/register/confirmation', { state: { email: data.email } })
    } catch (error) {
      setRegisterError(error.message || 'Une erreur est survenue lors de l\'inscription')
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
            <div className="aspect-square w-full rounded-3xl overflow-hidden shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-700 bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center">
              <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80')", backgroundPosition: 'center' }}></div>
              <div className="relative z-20 text-white text-center p-8">
                <span className="material-symbols-outlined text-6xl mb-6 opacity-80">security</span>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Sécurité Renforcée</h2>
                <p className="text-neutral-400 text-lg leading-relaxed">Protégez vos applications avec Kairos WebScan et détectez les vulnérabilités avant qu'elles ne soient exploitées.</p>
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

      {/* Right Panel: Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-white dark:bg-[#191919] overflow-y-auto">
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
            <h1 className="text-3xl font-bold tracking-tight text-[#141414] dark:text-white">Créer un compte</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Rejoignez Kairos WebScan en quelques secondes</p>
          </div>

          {/* Social Logins */}
          <div className="grid  gap-4">
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nom et Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#141414] dark:text-neutral-200" htmlFor="firstName">Prénom</label>
                <input
                  {...register('firstName')}
                  type="text"
                  id="firstName"
                  autoComplete="given-name"
                  className="w-full h-12 px-4 bg-[#f7f7f7] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-[#141414]/10 focus:border-[#141414] outline-none transition-all dark:text-white"
                  placeholder="Jean"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#141414] dark:text-neutral-200" htmlFor="lastName">Nom</label>
                <input
                  {...register('lastName')}
                  type="text"
                  id="lastName"
                  autoComplete="family-name"
                  className="w-full h-12 px-4 bg-[#f7f7f7] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-[#141414]/10 focus:border-[#141414] outline-none transition-all dark:text-white"
                  placeholder="Dupont"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#141414] dark:text-neutral-200" htmlFor="email">Adresse Email</label>
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
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#141414] dark:text-neutral-200" htmlFor="password">Mot de passe</label>
              <div className="relative">
                <input
                  {...register('password', { onChange: handlePasswordChange })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
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

              {/* Password strength indicator */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStrengthColor(passwordStrength)} transition-all duration-300`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength <= 2 ? 'text-red-600 dark:text-red-400' :
                      passwordStrength <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                      {getStrengthLabel(passwordStrength)}
                    </span>
                  </div>

                  {/* Suggestions */}
                  {passwordSuggestions.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Pour renforcer votre mot de passe :
                      </p>
                      <ul className="space-y-1">
                        {passwordSuggestions.map((suggestion, index) => (
                          <li key={index} className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1">
                            <span>•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#141414] dark:text-neutral-200" htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  className={`
                    w-full h-12 px-4 bg-[#f7f7f7] dark:bg-neutral-900 border rounded-lg focus:ring-2 focus:ring-[#141414]/10 focus:border-[#141414] outline-none transition-all dark:text-white pr-12
                    ${errors.confirmPassword ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-neutral-400 hover:text-[#141414] dark:hover:text-white"
                >
                  {showConfirmPassword ? (
                    <VisibilityOffRounded className="text-[20px]" />
                  ) : (
                    <VisibilityRounded className="text-[20px]" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {registerError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {registerError}
                </p>
              </div>
            )}

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                {...register('acceptTerms')}
                type="checkbox"
                id="acceptTerms"
                className={`size-4 rounded border-neutral-300 text-[#141414] focus:ring-[#141414] mt-0.5 ${errors.acceptTerms ? 'border-red-500' : ''}`}
              />
              <label htmlFor="acceptTerms" className="text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                J'accepte les{' '}
                <Link to="/terms" className="font-semibold text-[#141414] dark:text-white hover:underline underline-offset-4">
                  conditions d'utilisation
                </Link>
                {' '}et la{' '}
                <Link to="/privacy" className="font-semibold text-[#141414] dark:text-white hover:underline underline-offset-4">
                  politique de confidentialité
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.acceptTerms.message}
              </p>
            )}

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
                  <span>Créer mon compte</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-6 text-center">
            <p className="text-sm text-neutral-500">
              Vous avez déjà un compte ?{' '}
              <Link className="font-bold text-[#141414] dark:text-white hover:underline underline-offset-4" to="/login">
                Se connecter
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

export default RegisterPage
