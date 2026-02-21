import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { LinkRounded, CheckRounded } from '@mui/icons-material'

const LoginCallback = () => {
    const navigate = useNavigate()

    useEffect(() => {
        toast.success('Connexion réussie !')
        window.location.href = '/'
    }, [navigate])

    return (
        <div className="flex min-h-screen">
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#141414] items-center justify-center">
                <div className="absolute inset-0 z-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-600 via-[#141414] to-[#141414]"></div>
                <div className="relative z-10 w-full max-w-lg p-12">
                    <div className="relative group">
                        <div className="aspect-square w-full rounded-3xl overflow-hidden shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-700 bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80')", backgroundPosition: 'center' }}></div>
                            <div className="relative z-20 text-white text-center p-8">
                                <LinkRounded className="text-6xl mb-6 opacity-80" />
                                <h2 className="text-3xl font-bold mb-4 tracking-tight">Connexion sécurisée</h2>
                                <p className="text-neutral-400 text-lg leading-relaxed">Établissement d'une connexion sécurisée avec Kairos WebScan.</p>
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
                <div className="w-full max-w-[440px] space-y-8 text-center">
                    {/* Loading Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-neutral-200 dark:border-neutral-700"></div>
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-[#141414] dark:border-t-white absolute top-0 left-0"></div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight text-[#141414] dark:text-white">
                            Connexion en cours
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Veuillez patienter pendant que nous établissons votre connexion sécurisée...
                        </p>
                    </div>

                    {/* Loading Steps */}
                    <div className="bg-[#f7f7f7] dark:bg-neutral-900 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckRounded className="text-green-600 dark:text-green-400 text-[16px]" />
                            </div>
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">Authentification en cours</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
                            </div>
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">Configuration de votre session</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                                <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full"></div>
                            </div>
                            <span className="text-sm text-neutral-400 dark:text-neutral-500">Redirection vers votre tableau de bord</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-10 flex gap-6 text-xs text-neutral-400">
                    <span className="hover:text-[#141414] dark:hover:text-white transition-colors cursor-pointer">Politique de confidentialité</span>
                    <span className="hover:text-[#141414] dark:hover:text-white transition-colors cursor-pointer">Conditions d'utilisation</span>
                    <span className="hover:text-[#141414] dark:hover:text-white transition-colors cursor-pointer">Support</span>
                </div>
            </div>
        </div>
    )
}

export default LoginCallback
