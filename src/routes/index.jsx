import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import AccountLayout from '../components/ui/AccountLayout'
import HomePage from '../components/pages/HomePage'
import OrganizePage from '../components/pages/OrganizePage'
import AccountPage from '../components/pages/AccountPage'
import LoginPage from '../components/pages/LoginPage'
import RegisterPage from '../components/pages/RegisterPage'
import RegisterConfirmationPage from '../components/pages/RegisterConfirmationPage'
import ForgotPasswordPage from '../components/pages/ForgotPasswordPage'
import LoginCallback from '../components/pages/LoginCallback'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'organize',
        element: <OrganizePage />,
      },
    ],
  },
  {
    path: '/account',
    element: <AccountLayout />,
    children: [
      {
        index: true,
        element: <AccountPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/register/confirmation',
    element: <RegisterConfirmationPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/login/callback',
    element: <LoginCallback />,
  },
])
