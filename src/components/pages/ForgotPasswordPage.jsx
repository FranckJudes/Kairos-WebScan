import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'L\'email est requis').email('Email invalide')
})

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth()
  const [emailSent, setEmailSent] = useState(false)
  const [sentToEmail, setSentToEmail] = useState('')
  const [submitError, setSubmitError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data) => {
    try {
      setSubmitError(null)
      await forgotPassword(data.email)
      setEmailSent(true)
      setSentToEmail(data.email)
    } catch (error) {
      setSubmitError(error.message || 'Une erreur est survenue lors de l\'envoi de l\'email')
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#141414] items-center justify-center">
          {/* Abstract Background Pattern */}
          <div className="absolute inset-0 z-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-600 via-[#141414] to-[#141414]"></div>
          <div className="relative z-10 w-full max-w-lg p-12">
            <div className="relative group">
              <div className="aspect-square w-full rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700 bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center">
                <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&q=80')", backgroundPosition: 'center' }}></div>
                <div className="relative z-20 text-white text-center p-8">
                  <span className="material-symbols-outlined text-6xl mb-6 opacity-80">lock_reset</span>
                  <h2 className="text-3xl font-bold mb-4 tracking-tight">Réinitialisation</h2>
                  <p className="text-neutral-400 text-lg leading-relaxed">Suivez les instructions envoyées par email pour créer un nouveau mot de passe sécurisé.</p>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>
          <div className="absolute bottom-10 left-12 flex items-center gap-2 text-white/50">
            <span className="text-xs font-medium tracking-widest uppercase">Enterprise Edition</span>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-white dark:bg-[#191919]">
          <div className="w-full max-w-[440px] space-y-8">
            <div className="flex justify-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full">
                <span className="material-symbols-outlined text-5xl text-green-600 dark:text-green-400">check_circle</span>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-[#141414] dark:text-white mb-3">
                Email envoyé !
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400">
                Si un compte existe avec l'adresse <span className="font-semibold text-[#141414] dark:text-white">{sentToEmail}</span>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
              </p>
            </div>

            <div className="bg-[#f7f7f7] dark:bg-neutral-900 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">mail</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#141414] dark:text-neutral-200 mb-1">
                    Ce que faire maintenant
                  </p>
                  <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                      <span>Consultez votre boîte de réception</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                      <span>Cliquez sur le lien de réinitialisation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                      <span>Créez un nouveau mot de passe sécurisé</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <span className="font-semibold">⚠️ Le lien expire dans 1 heure.</span>
                  <br />
                  Si vous ne recevez pas l'email, vérifiez vos spams.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEmailSent(false)
                  setSentToEmail('')
                }}
                className="w-full h-12 flex items-center justify-center gap-2 px-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm font-semibold text-[#141414] dark:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                <span>Renvoyer l'email</span>
              </button>

              <Link
                to="/login"
                className="block w-full h-12 flex items-center justify-center gap-2 px-4 border border-transparent rounded-lg bg-[#141414] dark:bg-white text-white dark:text-[#141414] hover:opacity-90 active:scale-[0.98] transition-all text-sm font-bold"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                <span>Retour à la connexion</span>
              </Link>
            </div>
          </div>

          {/* Simple Help Footer */}
          <div className="mt-auto pt-10 flex gap-6 text-xs text-neutral-400">
            <span className="hover:text-[#141414] dark:hover:text-white transition-colors cursor-pointer">Politique de confidentialité</span>
            <span className="hover:text-[#141414] dark:hover:text-white transition-colors cursor-pointer">Conditions d'utilisation</span>
            <span className="hover:text-[#141414] dark:hover:text-white transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </div>
    )
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
              <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1632759145682-c723b7c9e59f?w=800&q=80')", backgroundPosition: 'center' }}></div>
              <div className="relative z-20 text-white text-center p-8">
                <span className="material-symbols-outlined text-6xl mb-6 opacity-80">password</span>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Mot de passe oublié ?</h2>
                <p className="text-neutral-400 text-lg leading-relaxed">Pas de souci ! Nous vous enverrons un lien de récupération pour réinitialiser votre mot de passe.</p>
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

      {/* Right Panel: Forgot Password Form */}
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

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-[#141414] dark:hover:text-white transition-colors w-fit"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Retour à la connexion</span>
            </Link>

            <h1 className="text-3xl font-bold tracking-tight text-[#141414] dark:text-white">Mot de passe oublié ?</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Entrez votre email et nous vous enverrons un lien de réinitialisation</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            {submitError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {submitError}
                </p>
              </div>
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
                  <span>Envoyer le lien de réinitialisation</span>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-6 text-center">
            <p className="text-sm text-neutral-500">
              Vous vous souvenez de votre mot de passe ?{' '}
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

export default ForgotPasswordPage
