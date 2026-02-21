import { Link, useLocation } from 'react-router-dom'
import {
  MarkEmailReadRounded,
  CheckCircleRounded,
  MailRounded,
  RefreshRounded,
  HomeRounded
} from '@mui/icons-material'

const RegisterConfirmationPage = () => {
  const location = useLocation()
  const email = location.state?.email || 'votre adresse email'

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
              <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80')", backgroundPosition: 'center' }}></div>
              <div className="relative z-20 text-white text-center p-8">
                <MarkEmailReadRounded className="text-6xl mb-6 opacity-80" />
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Vérification en cours</h2>
                <p className="text-neutral-400 text-lg leading-relaxed">Activez votre compte pour commencer à sécuriser vos applications avec Kairos WebScan.</p>
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

      {/* Right Panel: Confirmation Message */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-white dark:bg-[#191919]">
        <div className="w-full max-w-[440px] space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircleRounded className="text-5xl text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[#141414] dark:text-white mb-3">
              Vérifiez votre email
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Nous avons envoyé un email de confirmation à{' '}
              <span className="font-semibold text-[#141414] dark:text-white">{email}</span>
            </p>
          </div>

          {/* Instructions Card */}
          <div className="bg-[#f7f7f7] dark:bg-neutral-900 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <MailRounded className="text-blue-600 dark:text-blue-400 text-[20px]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#141414] dark:text-neutral-200 mb-1">
                  Instructions
                </p>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                    <span>Consultez votre boîte de réception</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                    <span>Cliquez sur le lien de vérification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                    <span>Votre compte sera activé instantanément</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <span className="font-semibold">⚠️ Le lien expire dans 24 heures.</span>
                <br />
                Si vous ne recevez pas l'email dans quelques minutes, vérifiez vos spams.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full h-12 flex items-center justify-center gap-2 px-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm font-semibold text-[#141414] dark:text-white"
            >
              <RefreshRounded className="text-[20px]" />
              <span>Renvoyer l'email</span>
            </button>

            <Link
              to="/"
              className="block w-full h-12 flex items-center justify-center gap-2 px-4 border border-transparent rounded-lg bg-[#141414] dark:bg-white text-white dark:text-[#141414] hover:opacity-90 active:scale-[0.98] transition-all text-sm font-bold"
            >
              <HomeRounded className="text-[20px]" />
              <span>Retour à l'accueil</span>
            </Link>

            <Link
              to="/login"
              className="block text-center text-sm text-neutral-500 hover:text-[#141414] dark:hover:text-white transition-colors"
            >
              Déjà un compte ? <span className="font-semibold">Se connecter</span>
            </Link>
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

export default RegisterConfirmationPage
