const AccountFooter = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-12 md:mt-16 mb-6 md:mb-8 text-center">
      <p className="text-xs text-slate-400 dark:text-dark-textTertiary">
        © {currentYear} Kairos WebScan. Tous droits réservés.
      </p>
    </footer>
  )
}

export default AccountFooter
