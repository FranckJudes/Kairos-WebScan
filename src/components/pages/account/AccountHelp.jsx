import { useState } from 'react'
import { HelpOutlineRounded, PhoneRounded, EmailRounded, ChatRounded, SearchRounded, ExpandMoreRounded } from '@mui/icons-material'

const FAQ_DATA = [
  {
    id: 1,
    question: "Comment scanner un document ?",
    answer: "Pour scanner un document, cliquez sur le bouton 'Importer des documents' dans l'en-tête ou faites glisser-déposer vos fichiers PDF ou images directement dans l'application. Le document sera automatiquement traité et classé."
  },
  {
    id: 2,
    question: "Quels formats de fichiers sont pris en charge ?",
    answer: "Nous supportons les formats suivants : PDF, JPG, JPEG, PNG, TIFF, BMP et WebP. Vous pouvez importer plusieurs fichiers simultanément."
  },
  {
    id: 3,
    question: "Comment organiser mes documents en bannettes ?",
    answer: "Après avoir scanné vos documents, vous pouvez les organiser en bannettes. Cliquez sur l'icône 'Bannettes' dans l'en-tête, puis créez une nouvelle bannette et ajoutez-y vos documents."
  },
  {
    id: 4,
    question: "Puis-je partager mes documents ?",
    answer: "Oui, vous pouvez partager vos documents via un lien sécurisé ou en les exportant. Cette fonctionnalité est disponible dans les options de chaque document."
  },
  {
    id: 5,
    question: "Comment changer mon mot de passe ?",
    answer: "Allez dans la section 'Informations du compte' puis cliquez sur 'Modifier'. Vous pourrez y changer votre mot de passe et vos informations personnelles."
  },
  {
    id: 6,
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument. Toutes vos données sont chiffrées et stockées de manière sécurisée. Nous utilisons les protocoles de sécurité les plus récents pour protéger vos informations."
  }
]

const AccountHelp = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    category: 'general'
  })

  const filteredFaq = FAQ_DATA.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  const handleContactSubmit = (e) => {
    e.preventDefault()
    // Ici, vous enverriez le formulaire à votre API
    console.log('Formulaire soumis:', contactForm)
    alert('Votre message a été envoyé ! Nous vous répondrons dans les plus brefs délais.')
    setContactForm({ subject: '', message: '', category: 'general' })
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-xl font-bold text-[#605e5c] dark:text-dark-text mb-6">
        Aide et support
      </h2>

      {/* Recherche */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#106EBE] dark:bg-blue-600 rounded-lg">
            <SearchRounded className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
              Comment pouvons-nous vous aider ?
            </h3>
            <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
              Recherchez dans notre base de connaissances
            </p>
          </div>
        </div>

        <div className="relative">
          <SearchRounded className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c8c6c4] dark:text-dark-textTertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une question, un sujet..."
            className="w-full pl-10 pr-4 py-3 border border-[#edebe9] dark:border-dark-border rounded-lg bg-white dark:bg-dark-bgSecondary text-[#605e5c] dark:text-dark-text placeholder-[#c8c6c4] dark:placeholder-dark-textTertiary focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-border">
          <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
            Questions fréquentes
          </h3>
          <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary mt-0.5">
            Les réponses aux questions les plus courantes
          </p>
        </div>

        <div className="divide-y divide-[#edebe9] dark:divide-dark-border">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((faq) => (
              <div key={faq.id}>
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
                >
                  <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text pr-4">
                    {faq.question}
                  </span>
                  <ExpandMoreRounded
                    className={`w-5 h-5 text-[#c8c6c4] dark:text-dark-textTertiary transition-transform flex-shrink-0 ${
                      expandedFaq === faq.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-[#605e5c] dark:text-dark-text pl-4 border-l-2 border-[#106EBE] dark:border-blue-500">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
                Aucun résultat pour "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-border">
          <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
            Nous contacter
          </h3>
          <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary mt-0.5">
            Notre équipe est là pour vous aider
          </p>
        </div>

        <div className="p-6">
          {/* Options de contact rapides */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button className="flex flex-col items-center gap-2 p-4 border border-[#edebe9] dark:border-dark-border rounded-lg hover:border-[#106EBE] dark:hover:border-blue-500 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors">
              <PhoneRounded className="w-6 h-6 text-[#106EBE] dark:text-blue-500" />
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">Téléphone</span>
              <span className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">+33 1 23 45 67 89</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 border border-[#edebe9] dark:border-dark-border rounded-lg hover:border-[#106EBE] dark:hover:border-blue-500 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors">
              <EmailRounded className="w-6 h-6 text-[#106EBE] dark:text-blue-500" />
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">Email</span>
              <span className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">support@kairos.com</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 border border-[#edebe9] dark:border-dark-border rounded-lg hover:border-[#106EBE] dark:hover:border-blue-500 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors">
              <ChatRounded className="w-6 h-6 text-[#106EBE] dark:text-blue-500" />
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">Chat en direct</span>
              <span className="text-xs text-green-600 dark:text-green-400">Disponible maintenant</span>
            </button>
          </div>

          {/* Formulaire de contact */}
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
                Catégorie
              </label>
              <select
                value={contactForm.category}
                onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg bg-white dark:bg-dark-bgSecondary text-[#605e5c] dark:text-dark-text focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">Question générale</option>
                <option value="technical">Problème technique</option>
                <option value="billing">Facturation</option>
                <option value="feature">Demande de fonctionnalité</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
                Sujet
              </label>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                required
                placeholder="Décrivez brièvement votre demande"
                className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg bg-white dark:bg-dark-bgSecondary text-[#605e5c] dark:text-dark-text placeholder-[#c8c6c4] dark:placeholder-dark-textTertiary focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
                Message
              </label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                required
                rows={5}
                placeholder="Décrivez votre question ou problème en détail..."
                className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg bg-white dark:bg-dark-bgSecondary text-[#605e5c] dark:text-dark-text placeholder-[#c8c6c4] dark:placeholder-dark-textTertiary focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Envoyer le message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AccountHelp
