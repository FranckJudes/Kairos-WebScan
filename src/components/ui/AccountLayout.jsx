import { Outlet } from 'react-router-dom'

function AccountLayout() {
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-dark-bg text-[#605e5c] dark:text-dark-text overflow-hidden transition-colors duration-200">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

export default AccountLayout
