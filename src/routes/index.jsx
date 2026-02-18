import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import HomePage from '../components/pages/HomePage'
import OrganizePage from '../components/pages/OrganizePage'
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
